from config.ts_constants import TSConstants
class ConfigDir:

    def __init__(self):
        ...
    @classmethod
    def init(cls, base_dir:str):
        TSConstants.set_directory(base_dir)
        # 设置 babeldoc 的缓存目录
        from babeldoc.const import set_cache_folder
        set_cache_folder(base_dir)

   