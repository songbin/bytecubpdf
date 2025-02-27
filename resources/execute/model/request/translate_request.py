class TranslateRequest:
    def __init__(
        self,
        from_lang: str,
        to_lang: str,
        platform: str = None,
        model: str = None,
        api_key: str = None,
        file_path: str = None,
    ):
        self.from_lang = from_lang
        self.to_lang = to_lang
        self.platform = platform
        self.model = model
        self.api_key = api_key
        self.file_path = file_path

    def to_dict(self) -> dict:
        """
        将类的实例属性转换为字典。
        """
        return {
            "sourceLanguage": self.from_lang,
            "targetLanguage": self.to_lang,
            "platform": self.platform,
            "model": self.model,
            "apiKey": self.api_key,
            "file_path": self.file_path
        }

    @classmethod
    def from_dict(cls, data: dict) -> "TranslateRequest":
        """
        从字典中提取数据并初始化类的实例。
        """
        return cls(
            from_lang=data.get("sourceLanguage", ""),
            to_lang=data.get("targetLanguage", ""),
            platform=data.get("platform"),
            model=data.get("model"),
            api_key=data.get("apiKey"),
            file_path=data.get("file_path"),
        )

    def __repr__(self):
        """
        返回类的字符串表示，便于调试。
        """
        return (
            f"TranslateRequest(from_lang={self.from_lang}, "
            f"to_lang={self.to_lang}, platform={self.platform}, "
            f"model={self.model}, api_key={self.api_key}, "
            f"file_path={self.file_path})"
        )