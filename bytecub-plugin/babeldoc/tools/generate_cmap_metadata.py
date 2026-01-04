"""
This script is used to automatically generate the following file:
https://github.com/funstory-ai/BabelDOC-Assets/blob/main/cmap_metadata.json
"""

import argparse
import hashlib
import logging
from pathlib import Path

import orjson
from rich.logging import RichHandler

logger = logging.getLogger(__name__)


def _calc_sha3_256(path: Path) -> str:
    """Calculate sha3-256 for a given file path."""
    hash_ = hashlib.sha3_256()
    with path.open("rb") as f:
        # Read the file in chunks to handle large files efficiently
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            hash_.update(chunk)
    return hash_.hexdigest()


def main() -> None:
    logging.basicConfig(level=logging.INFO, handlers=[RichHandler()])
    parser = argparse.ArgumentParser(description="Generate cmap metadata.")
    parser.add_argument(
        "assets_repo_path",
        type=str,
        help="Path to the BabelDOC-Assets repository.",
    )
    args = parser.parse_args()
    repo_path = Path(args.assets_repo_path)
    assert repo_path.exists(), f"Assets repo path {repo_path} does not exist."
    assert (repo_path / "README.md").exists(), (
        f"Assets repo path {repo_path} does not contain a README.md file."
    )
    assert (repo_path / "cmap").exists(), (
        f"Assets repo path {repo_path} does not contain a cmap folder."
    )
    logger.info(f"Getting cmap metadata for {repo_path}")

    metadatas: dict[str, dict[str, object]] = {}
    cmap_dir = repo_path / "cmap"
    for cmap_path in sorted(cmap_dir.glob("**/*.json")):
        if not cmap_path.is_file():
            continue
        logger.info(f"Getting cmap metadata for {cmap_path}")
        sha3_256 = _calc_sha3_256(cmap_path)
        metadata = {
            "file_name": cmap_path.name,
            "sha3_256": sha3_256,
            "size": cmap_path.stat().st_size,
        }
        metadatas[cmap_path.name] = metadata

    metadatas_json = orjson.dumps(
        metadatas,
        option=orjson.OPT_APPEND_NEWLINE | orjson.OPT_INDENT_2 | orjson.OPT_SORT_KEYS,
    ).decode()
    print(f"CMAP METADATA: {metadatas_json}")
    with (repo_path / "cmap_metadata.json").open("w") as f:
        f.write(metadatas_json)


if __name__ == "__main__":
    main()
