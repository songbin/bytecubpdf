# 空模块用于屏蔽hyperscan

class _dummy_hyperscan:
    def __getattr__(self, name):
        return lambda *args, **kwargs: None

hyperscan = _dummy_hyperscan()