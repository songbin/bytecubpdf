## 1.high_level.py
### 1.1 
    if callback:
                # callback(progress)
                callback(current_page=pageno + 1, total_pages=total_pages)  
### 1.2 
   translate 方法修改返回值和文件
### 1.3 
   font_path = ConfigManager.get("NOTO_FONT_PATH", Path("/app", font_name).as_posix())
   改成这样
   font_path = TSConstants.fonts_folder / font_name
### 1.4  babelDoc的修改
   
   #### 1,在pdf_creater.py中给输出文件加时间戳
   删除水印后缀 debug_suffix += ".no_watermark"
   time_str = TimeUtil.get_yyyymmddhhmmss()
        mono_out_path = translation_config.get_output_file_path(
            f"{basename}{debug_suffix}.{time_str}{translation_config.lang_out}.mono.pdf",
        )
        #增加获取总页数
      pdf = pymupdf.open(self.original_pdf_path)
        total_pages:int = pdf.page_count   

      这里还加了个输出name，用于返回只返回名字

      mono_out_file_name = f"{basename}{debug_suffix}.{time_str}{translation_config.lang_out}.mono.pdf"
        mono_out_path = translation_config.get_output_file_path(
            f"{mono_out_file_name}",
        )
   #### 2.TranslateResult类中添加2个属性，用于存储pdf总页数和文件名以及source_base_name。
   translate_config.py下的class TranslateResult
   def __init__(self, mono_pdf_path: str | None, dual_pdf_path: str | None, total_pages: int | 1):
   对应在pdf_creater.py中最后一行返回结果的时候，把总页数加上
   #### 3.il_translator_llm_only.py中
    这个新版本已经没有了
   enc = tiktoken.encoding_for_model("gpt-4o")注释掉
   #### 4.babeldoc.const import set_cache_folder
    这里增加set_cache_folder方法
    def set_cache_folder(path: str | Path):
      global CACHE_FOLDER
      CACHE_FOLDER = Path(path)
  #### 5. il_translator.py中
     <!-- paragraph_token_count = 0 因为打包exe后token不打包，原因是token打包会有问题 -->
     self.tokenizer = tiktoken.encoding_for_model("gpt-4o")
     这一行代码注释掉，因为token打包的时候有问题
#### 6 rapidocr.py中
   增加config。yaml路径
   RapidOCRModel下的修改为
    config_path = self.build_config()
        self.model = RapidOCR(
            det_model_path=get_table_detection_rapidocr_model_path(),
            det_use_cuda=self.use_cuda,
            det_use_dml=self.use_dml,
            config_path=config_path,
        )
    ###### build_config实现（还要增加ripidocr_config.py ）
         def build_config(self):
        from babeldoc.const import get_cache_file_path
        import os
        from babeldoc.docvision.table_detection.ripadocr_config import get_rapidocr_config
        import yaml
        
        config_path = get_cache_file_path("config.yaml", "models")
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        # 获取配置字典并写入文件(每次覆盖)
        config = get_rapidocr_config()
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, allow_unicode=True)
        return config_path