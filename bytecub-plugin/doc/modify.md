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
### 1.4 增加双语对照pdf生成
    在high_level.py中增加create_side_by_side_dual_pdf方法，用于生成双语对照pdf。
### 1.4  babelDoc的修改
   
   #### 1,在pdf_creater.py中给输出文件加时间戳
   删除水印后缀 debug_suffix += ".no_watermark"
   time_str = TimeUtil.get_yyyymmddhhmmss()
        mono_out_path = translation_config.get_output_file_path(
            f"{basename}{debug_suffix}.{time_str}{translation_config.lang_out}.mono.pdf",
        )
    给dual_out_path也加时间戳
        dual_out_path = translation_config.get_output_file_path(
            f"{basename}{debug_suffix}.{time_str}{translation_config.lang_out}.dual.pdf",
        )
        #增加获取总页数
      pdf = pymupdf.open(self.original_pdf_path)
        total_pages:int = pdf.page_count   

      这里还加了个输出name，用于返回只返回名字

      mono_out_file_name = f"{basename}{debug_suffix}.{time_str}{translation_config.lang_out}.mono.pdf"
        mono_out_path = translation_config.get_output_file_path(
            f"{mono_out_file_name}",
        )
        屏蔽auto_extracted_glossary_path写操作
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
     calc_token_count这个方法里，直接返回0
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
#### 7 assets.py中
   verify_file增加
   if sha3_256 is None:
        return True
### 8.embedding_assets_metadata.py中
    TABLE_DETECTION_RAPIDOCR_MODEL_REC_SHA3_256 = (
        "6040d1cb9554886e166fd817af0ab69c5cce8e5e80b8a111c1f08258ad4c4b22"
    )

    TABLE_DETECTION_RAPIDOCR_MODEL_CLS_SHA3_256 = (
        "1fe31cb7e7babb2fc4cfe7090b1e93fc538b9a4a36a5f9af72bd6da78c9afc26"
    )
### 9.format/document_il/midend/detect_scanned_file.py
   Scanned PDF detected 把 # raise ScannedPDFError("Scanned PDF detected.")注释掉

1. babeldoc/format/pdf/document_il/frontend/il_creater.py
注释掉了 import tiktoken
将 self.tokenizer = tiktoken.encoding_for_model("gpt-4o") 改为 self.tokenizer = None
修改了 token 计算逻辑，直接返回 0（因为这里只用于统计）
2. babeldoc/format/pdf/document_il/midend/il_translator.py
注释掉了 import tiktoken
将 tokenizer 初始化代码注释掉，设置为 self.tokenizer = None
修改 calc_token_count 方法，使用 len(text) // 4 来近似计算 token 数（英文文本中约 4 个字符等于 1 个 token）
3. babeldoc/format/pdf/document_il/midend/il_translator_llm_only.py
注释掉了 import tiktoken
将 tokenizer 初始化代码注释掉，设置为 self.tokenizer = None
修改 calc_token_count 方法，使用字符数近似计算 token 数
4. babeldoc/format/pdf/document_il/midend/automatic_term_extractor.py
注释掉了 import tiktoken
将 self.tokenizer = tiktoken.encoding_for_model("gpt-4o") 改为 self.tokenizer = None
修改 calc_token_count 方法，使用字符数近似计算 token 数
5. babeldoc/assets/assets.py
注释掉了预热函数中的 tiktoken 初始化代码
修改原理
tiktoken 的作用：原本用于精确计算文本的 token 数量，主要用于统计和优先级计算
替代方案：使用 len(text) // 4 来近似计算 token 数（这是一个经验公式，英文文本中平均 4 个字符约等于 1 个 token）
影响评估：
token 计数只用于统计日志和任务优先级排序
不会影响翻译的核心功能
使用近似值对系统运行影响很小
这样修改后，你再次使用 build_exe.py 打包成 exe 文件，运行 babeldoc 翻译时就不会再出现 "Unknown encoding o200k_base" 的错误了。
