from pydantic import BaseModel
class TranslateRequest(BaseModel):
    def __init__(
        self,
        from_lang: str,
        to_lang: str,
        platform: str = None,
        model: str = None,
        api_key: str = None,
        file_path: str = None,
        translate_engine: str = 'pdfmath',
        threads: int = 4,
        base_url: str = '',
        cache_dir: str = '',
        term_dict: dict = None,
        max_pages: int = 0,  # 新增每页最大页数字段
        enable_ocr: bool = False,  # 新增OCR识别字段
        disable_rich_text: bool = False,  # 新增禁用富文字段
        enable_table: bool = False  # 新增表格翻译字段
    ):
        self.from_lang = from_lang
        self.to_lang = to_lang
        self.platform = platform
        self.model = model
        self.api_key = api_key
        self.file_path = file_path
        self.translate_engine = translate_engine
        self.threads = threads
        self.base_url = base_url
        self.cache_dir = cache_dir
        self.term_dict = term_dict or {}
        self.max_pages = max_pages
        self.enable_ocr = enable_ocr
        self.disable_rich_text = disable_rich_text
        self.enable_table = enable_table

    def to_dict(self) -> dict:
        return {
            "sourceLanguage": self.from_lang,
            "targetLanguage": self.to_lang,
            "platform": self.platform,
            "model": self.model,
            "apiKey": self.api_key,
            "file_path": self.file_path,
            "threads": self.threads,
            "translate_engine": self.translate_engine,
            "base_url": self.base_url,
            "cache_dir": self.cache_dir,
            "term_dict": self.term_dict,
            "max_pages": self.max_pages,  # 新增字段
            "enable_ocr": self.enable_ocr,  # 新增字段
            "disable_rich_text": self.disable_rich_text,  # 新增字段
            "enable_table": self.enable_table  # 新增字段
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TranslateRequest":
        return cls(
            from_lang=data.get("sourceLanguage", ""),
            to_lang=data.get("targetLanguage", ""),
            platform=data.get("platform"),
            model=data.get("model"),
            api_key=data.get("apiKey"),
            file_path=data.get("file_path"),
            threads=data.get("threads", 4),
            translate_engine=data.get("translate_engine", "pdfmath"),
            base_url=data.get("base_url", ""),
            cache_dir=data.get("cache_dir", ""),
            term_dict=data.get("term_dict", {}),
            max_pages=data.get("max_pages", 0),  # 新增字段
            enable_ocr=data.get("enable_ocr", False),  # 新增字段
            disable_rich_text=data.get("disable_rich_text", False),  # 新增字段
            enable_table=data.get("enable_table", False)  # 新增字段
        )

    def __repr__(self):
        return (
            f"TranslateRequest(from_lang={self.from_lang}, "
            f"to_lang={self.to_lang}, platform={self.platform}, "
            f"model={self.model}, api_key={self.api_key}, "
            f"file_path={self.file_path}, threads={self.threads}, "
            f"translate_engine={self.translate_engine}, "
            f"base_url={self.base_url}, "
            f"cache_dir={self.cache_dir}, "
            f"term_dict={self.term_dict}, "
            f"max_pages={self.max_pages}, "  # 新增字段
            f"enable_ocr={self.enable_ocr}, "  # 新增字段
            f"disable_rich_text={self.disable_rich_text}, "  # 新增字段
            f"enable_table={self.enable_table})"  # 新增字段
        )