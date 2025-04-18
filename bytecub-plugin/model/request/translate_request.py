class TranslateRequest:
    def __init__(
        self,
        from_lang: str,
        to_lang: str,
        platform: str = None,
        model: str = None,
        api_key: str = None,
        file_path: str = None,
        translate_engine: str = 'pdfmath',  # 新增翻译引擎参数
        threads: int = 4,
        base_url: str = '',
        cache_dir: str = '',
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
            "cache_dir": self.cache_dir
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
            cache_dir=data.get("cache_dir", "")
        )

    def __repr__(self):
        return (
            f"TranslateRequest(from_lang={self.from_lang}, "
            f"to_lang={self.to_lang}, platform={self.platform}, "
            f"model={self.model}, api_key={self.api_key}, "
            f"file_path={self.file_path}, threads={self.threads}, "
            f"translate_engine={self.translate_engine})",
            f"base_url={self.base_url})"
            f"cache_dir={self.cache_dir})"
        )