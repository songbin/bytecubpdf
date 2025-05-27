class OcrRequest:
    def __init__(
        self,
        platform: str = None,
        model: str = None,
        api_key: str = None,
        file_path: str = None,
        threads: int = 4,
        base_url: str = '',
        cache_dir: str = '',
        term_dict: dict = None,
        max_pages: int = 0,  # 新增每页最大页数字段
        
    ):
        self.platform = platform
        self.model = model
        self.api_key = api_key
        self.file_path = file_path
        self.threads = threads
        self.base_url = base_url
        self.cache_dir = cache_dir
        self.term_dict = term_dict or {}
        self.max_pages = max_pages
       

    def to_dict(self) -> dict:
        return {
            "platform": self.platform,
            "model": self.model,
            "apiKey": self.api_key,
            "file_path": self.file_path,
            "threads": self.threads,
            "base_url": self.base_url,
            "cache_dir": self.cache_dir,
            "term_dict": self.term_dict,
            "max_pages": self.max_pages,  # 新增字段
           
        }

    @classmethod
    def from_dict(cls, data: dict) -> "OcrRequest":
        return cls(
            platform=data.get("platform"),
            model=data.get("model"),
            api_key=data.get("apiKey"),
            file_path=data.get("file_path"),
            threads=data.get("threads", 4),
            base_url=data.get("base_url", ""),
            cache_dir=data.get("cache_dir", ""),
            term_dict=data.get("term_dict", {}),
            max_pages=data.get("max_pages", 0),  # 新增字段
           
        )

    def __repr__(self):
        return (
            f"TranslateRequest( platform={self.platform}, "
            f"model={self.model}, api_key={self.api_key}, "
            f"file_path={self.file_path}, threads={self.threads}, "
            f"base_url={self.base_url}, "
            f"cache_dir={self.cache_dir}, "
            f"term_dict={self.term_dict}, "
            f"max_pages={self.max_pages}, " 
        )