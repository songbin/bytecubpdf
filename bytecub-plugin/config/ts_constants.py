from math import log


class TSConstants():
   upload_folder:str = 'cachedata/files/upload' # 上传文件存储路径
   translate_folder:str = 'cachedata/files/translate' # 翻译文件存储路径
   fonts_folder:str = 'cachedata/fonts' # 字体存储路径
   cache_file_path:str = 'cachedata' # 缓存文件存储路径
   log_file_path:str = 'logs' # 日志文件存储路径
   @classmethod
   def set_directory(cls, cache_dir:str):
      cls.upload_folder = cache_dir + '/files/upload' # 上传文件存储路径
      cls.translate_folder = cache_dir + '/files/translate' # 翻译文件存储路径
      cls.fonts_folder = cache_dir + '/fonts' # 字体存储路径
      # cls.log_file_path = cache_dir + '/logs' # 日志文件存储路径

class TSCore():
   pdfmath:str = 'pdfmath'
   babeldoc:str = 'babeldoc'

class TSStatus():
   processing:str = 'processing'
   completed:str = 'completed'
   error:str = 'error'
   