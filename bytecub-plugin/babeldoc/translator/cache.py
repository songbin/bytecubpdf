import json
import logging
import random
import threading
from pathlib import Path

import peewee
from peewee import SQL
from peewee import AutoField
from peewee import CharField
from peewee import Model
from peewee import SqliteDatabase
from peewee import TextField
from peewee import fn  # For aggregation functions

from babeldoc.const import CACHE_FOLDER

logger = logging.getLogger(__name__)

# we don't init the database here
db = SqliteDatabase(None)

# Cleanup configuration
CLEAN_PROBABILITY = 0.001  # 0.1% chance to trigger cleanup
MAX_CACHE_ROWS = 50_000  # Keep only the latest 50,000 rows

# Thread-level mutex to ensure only one cleanup runs at a time within the process
_cleanup_lock = threading.Lock()


class _TranslationCache(Model):
    id = AutoField()
    translate_engine = CharField(max_length=20)
    translate_engine_params = TextField()
    original_text = TextField()
    translation = TextField()

    class Meta:
        database = db
        constraints = [
            SQL(
                """
            UNIQUE (
                translate_engine,
                translate_engine_params,
                original_text
                )
            ON CONFLICT REPLACE
            """,
            ),
        ]


class TranslationCache:
    @staticmethod
    def _sort_dict_recursively(obj):
        if isinstance(obj, dict):
            return {
                k: TranslationCache._sort_dict_recursively(v)
                for k in sorted(obj.keys())
                for v in [obj[k]]
            }
        elif isinstance(obj, list):
            return [TranslationCache._sort_dict_recursively(item) for item in obj]
        return obj

    def __init__(self, translate_engine: str, translate_engine_params: dict = None):
        self.translate_engine = translate_engine
        self.replace_params(translate_engine_params)

    # The program typically starts multi-threaded translation
    # only after cache parameters are fully configured,
    # so thread safety doesn't need to be considered here.
    def replace_params(self, params: dict = None):
        if params is None:
            params = {}
        self.params = params
        params = self._sort_dict_recursively(params)
        self.translate_engine_params = json.dumps(params)

    def update_params(self, params: dict = None):
        if params is None:
            params = {}
        self.params.update(params)
        self.replace_params(self.params)

    def add_params(self, k: str, v):
        self.params[k] = v
        self.replace_params(self.params)

    # Since peewee and the underlying sqlite are thread-safe,
    # get and set operations don't need locks.
    def get(self, original_text: str) -> str | None:
        try:
            result = _TranslationCache.get_or_none(
                translate_engine=self.translate_engine,
                translate_engine_params=self.translate_engine_params,
                original_text=original_text,
            )
            # Trigger cache cleanup with a small probability.
            if result and random.random() < CLEAN_PROBABILITY:  # noqa: S311
                self._cleanup()
            return result.translation if result else None
        except peewee.OperationalError as e:
            if "database is locked" in str(e):
                logger.debug("Cache is locked")
                return None
            else:
                raise

    def set(self, original_text: str, translation: str):
        try:
            _TranslationCache.create(
                translate_engine=self.translate_engine,
                translate_engine_params=self.translate_engine_params,
                original_text=original_text,
                translation=translation,
            )
            # Trigger cache cleanup with a small probability.
            if random.random() < CLEAN_PROBABILITY:  # noqa: S311
                self._cleanup()
        except peewee.OperationalError as e:
            if "database is locked" in str(e):
                logger.debug("Cache is locked")
            else:
                raise

    def _cleanup(self) -> None:
        """Remove old cache entries, keeping only the latest MAX_CACHE_ROWS records."""
        # Quick exit if another thread is already performing cleanup.
        if not _cleanup_lock.acquire(blocking=False):
            return
        try:
            logger.info("Cleaning up translation cache...")
            max_id = _TranslationCache.select(fn.MAX(_TranslationCache.id)).scalar()
            # Nothing to do if table is empty or below threshold
            if not max_id or max_id <= MAX_CACHE_ROWS:
                return
            threshold = max_id - MAX_CACHE_ROWS
            # Delete rows with id *less than or equal* to threshold so that at most MAX_CACHE_ROWS remain.
            _TranslationCache.delete().where(
                _TranslationCache.id <= threshold
            ).execute()
        finally:
            _cleanup_lock.release()


def init_db(remove_exists=False):
    CACHE_FOLDER.mkdir(parents=True, exist_ok=True)
    # The current version does not support database migration, so add the version number to the file name.
    cache_db_path = CACHE_FOLDER / "cache.v1.db"
    logger.info(f"Initializing cache database at {cache_db_path}")
    if remove_exists and cache_db_path.exists():
        cache_db_path.unlink()
    db.init(
        cache_db_path,
        pragmas={
            "journal_mode": "wal",
            "busy_timeout": 1000,
        },
    )
    db.create_tables([_TranslationCache], safe=True)


def init_test_db():
    import tempfile

    temp_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    cache_db_path = temp_file.name
    temp_file.close()

    test_db = SqliteDatabase(
        cache_db_path,
        pragmas={
            "journal_mode": "wal",
            "busy_timeout": 1000,
        },
    )
    test_db.bind([_TranslationCache], bind_refs=False, bind_backrefs=False)
    test_db.connect()
    test_db.create_tables([_TranslationCache], safe=True)
    return test_db


def clean_test_db(test_db):
    test_db.drop_tables([_TranslationCache])
    test_db.close()
    db_path = Path(test_db.database)
    if db_path.exists():
        db_path.unlink()
    wal_path = Path(str(db_path) + "-wal")
    if wal_path.exists():
        wal_path.unlink()
    shm_path = Path(str(db_path) + "-shm")
    if shm_path.exists():
        shm_path.unlink()


init_db()
