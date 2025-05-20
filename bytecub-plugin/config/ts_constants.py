from math import log


class TSConstants():
   upload_folder:str = 'cachedata/files/upload' # PDF翻译的上传文件存储路径
   translate_folder:str = 'cachedata/files/translate' # 翻译文件存储路径
   fonts_folder:str = 'cachedata/fonts' # 字体存储路径
   cache_file_path:str = 'cachedata' # 缓存文件存储路径
   log_file_path:str = 'logs' # 日志文件存储路径
   upload_ocr_folder:str = 'cachedata/files/upload_ocr' # OCR识别的上传文件存储路径
   upload_ocr_image_folder:str = 'cachedata/files/upload_ocr_img' # OCR识别的上传图片文件存储路径
   upload_ocr_result_md_folder:str = 'cachedata/files/upload_ocr_result_md' # OCR识别结果，markdown格式的存储路径
   upload_ocr_result_docx_folder:str = 'cachedata/files/upload_ocr_result_docx' # OCR识别结果，docx格式的存储路径
   @classmethod
   def set_directory(cls, cache_dir:str):
      cls.upload_folder = cache_dir + '/files/upload' # 上传文件存储路径
      cls.translate_folder = cache_dir + '/files/translate' # 翻译文件存储路径
      cls.fonts_folder = cache_dir + '/fonts' # 字体存储路径
      cls.upload_ocr_folder = cache_dir + '/files/upload_ocr' # OCR识别的上传文件存储路径
      cls.upload_ocr_image_folder = cache_dir + '/files/upload_ocr_img' # OCR识别的上传图片文件存储路径
      cls.upload_ocr_result_md_folder = cache_dir + '/files/upload_ocr_result_md' # OCR识别结果，markdown格式的存储路径
      cls.upload_ocr_result_docx_folder = cache_dir + '/files/upload_ocr_result_docx' # OCR识别结果，docx格式的存储路径
      # cls.log_file_path = cache_dir + '/logs' # 日志文件存储路径

class TSCore():
   pdfmath:str = 'pdfmath'
   babeldoc:str = 'babeldoc'

class ENVDict():
   TERM_DICT:str = 'TERM_DICT'
   ENGINE:str = 'ENGINE'

class TSStatus():
   processing:str = 'processing'
   completed:str = 'completed'
   error:str = 'error'

class UploadBiz():
   ocr:str = 'ocr'
   translate:str = 'translate'
class LLM_SUPPORT():
   openai:str = 'openai'
   ollama:str = 'ollama'
class Layout_Direction():
   left_to_right:str = 'left_to_right'
   right_to_left:str = 'right_to_left'
class AGENT_EXPAND_KEY():
   agent_code:str = 'agent_code'
   file_path:str = 'file_path'
   file_type:str = 'file_type'
   layoutDirection: str = Layout_Direction.left_to_right
   enabaleSentence:str = 'enabaleSentence'
   enableVertical:str = 'enableVertical'
   enableConvert:str = 'enableConvert'
   