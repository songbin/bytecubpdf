from tkinter import NO
from babeldoc.format.pdf.translation_config import TranslationConfig as YadtConfig
from babeldoc.format.pdf.high_level import async_translate as yadt_translate
from babeldoc.format.pdf.high_level import init as yadt_init
from babeldoc.main import create_progress_handler
from pdf2zh.high_level import download_remote_fonts
from services.pdfmath_service import PdfMathService
from utils.chatlog import logger
from config.ts_constants import TSConstants, TSCore,TSStatus
from babeldoc.format.pdf.translation_config import TranslationConfig
import os
from babeldoc.format.pdf.translation_config import WatermarkOutputMode
from babeldoc.docvision.table_detection.rapidocr import RapidOCRModel
import asyncio
from functools import partial
from pathlib import Path
class PdfBabelSerive:
    def __init__(self, pdf_file):
        self.pdf_file = pdf_file

    def extract_text(self):
        # Implement the logic to extract text from the PDF file
        pass
    @classmethod
    def translate(
        cls,
        file_path: str,
        lang_in: str = "",
        lang_out: str = "",
        service: str = "",
        model_name: str = "",
        api_key: str = "",
        base_url: str = "",
        thread: int = 4,
        callback = None,
        cancellation_event=None,
        term_dict = None,
        max_pages: int = 0,  # 新增每页最大页数字段
        enable_ocr: bool = False,  # 新增OCR识别字段
        disable_rich_text: bool = False,  # 新增禁用富文字段
        enable_table: bool = False,  # 新增表格翻译字段
        no_dual: bool = True,  # 新增禁用双页翻译字段
    ):
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise ValueError(f"File not found: {file_path}")
        yadt_init()
        font_path = download_remote_fonts(lang_out.lower())
        service_name = service
        service_model = model_name
        untranlate_file = [file_path]
        from config.ts_constants import TSCore
        
        envs = PdfMathService._build_envs(service, model_name, api_key,base_url, 
        term_dict=term_dict, engine=TSCore.babeldoc)
        # 构建翻译器
        translator =  cls.__query_platform(service_name, lang_in, lang_out, service_model, envs, None)
        save_path = os.path.join(os.getcwd(), TSConstants.translate_folder)
         # 如果路径不存在，则创建
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        for file in untranlate_file:
            file = file.strip("\"'")
            table_model = None
            if enable_table:
                table_model = RapidOCRModel()
            split_strategy = None
            if max_pages > 0:
                split_strategy = TranslationConfig.create_max_pages_per_part_split_strategy(max_pages)
            
            yadt_config = YadtConfig(
                input_file=file,
                font=font_path,
                pages=",".join([]),
                output_dir=save_path,
                doc_layout_model=None,
                translator=translator,
                debug=False,
                lang_in=lang_in,
                lang_out=lang_out,
                no_dual=no_dual,
                no_mono=False,
                qps=thread,
                watermark_output_mode = WatermarkOutputMode.NoWatermark,
                use_rich_pbar = False,
                split_strategy=None,
                disable_rich_text_translate = disable_rich_text,
                ocr_workaround = enable_ocr,
                table_model = table_model,
                skip_clean = True,
            )
            
            result_path = asyncio.run(cls.__yadt_translate_coro(
                file_path = file,
                yadt_config=yadt_config,
                cancellation_event=cancellation_event, 
                callback=callback))
            return result_path
                        

    @classmethod        
    async def __yadt_translate_coro(cls, file_path= None, yadt_config=None, cancellation_event=None, callback = None):
                progress_context, progress_handler = create_progress_handler(yadt_config)
                # 开始翻译
                with progress_context:
                    async for event in yadt_translate(yadt_config):
                        # logger.info(event)   
                        progress_handler(event)
                        # 检查是否取消
                        if cancellation_event and cancellation_event.is_set():
                            raise Exception("Translation cancelled by user")
                        # 处理进度事件（关键修改点）
                        if event["type"] == "progress_update" and callback:
                            # 从事件中提取页面信息
                            current_page = event.get("stage_current", 0)
                            total_pages = event.get("stage_total", 1)
                            stage = event.get("stage", "")
                            overall_progress = event.get("overall_progress", 0)
                            callback(current_page, total_pages, 
                                     core=TSCore.babeldoc,
                                     current_part=current_page,
                                     total_parts=total_pages,
                                     stage=stage, overall_progress=overall_progress) 
                        if event["type"] == "finish":
                            result = event["translate_result"]
                            logger.info(f"###########Translation finished: {result}")
                            logger.info(f"#############Translation finished: {result.mono_pdf_path}")
                            dual_out_file_name = None
                            if result.dual_pdf_path:
                                dual_out_file_name =  Path(result.dual_pdf_path).name 
                            return (str(result.mono_pdf_path), 
                            result.mono_out_file_name,
                            result.source_base_name,
                            dual_out_file_name,
                             result.total_pages)
                            #break

    @classmethod
    def __query_platform( cls, service_name:str,lang_in, lang_out, service_model, envs, prompt):
        from pdf2zh.translator import (
        AzureOpenAITranslator,
        GoogleTranslator,
        BingTranslator,
        DeepLTranslator,
        DeepLXTranslator,
        OllamaTranslator,
        OpenAITranslator,
        ZhipuTranslator,
        ModelScopeTranslator,
        SiliconTranslator,
        GeminiTranslator,
        AzureTranslator,
        TencentTranslator,
        DifyTranslator,
        AnythingLLMTranslator,
        XinferenceTranslator,
        ArgosTranslator,
        GorkTranslator,
        GroqTranslator,
        DeepseekTranslator,
        OpenAIlikedTranslator,
        QwenMtTranslator,
    )

        for translator in [
            GoogleTranslator,
            BingTranslator,
            DeepLTranslator,
            DeepLXTranslator,
            OllamaTranslator,
            XinferenceTranslator,
            AzureOpenAITranslator,
            OpenAITranslator,
            ZhipuTranslator,
            ModelScopeTranslator,
            SiliconTranslator,
            GeminiTranslator,
            AzureTranslator,
            TencentTranslator,
            DifyTranslator,
            AnythingLLMTranslator,
            ArgosTranslator,
            GorkTranslator,
            GroqTranslator,
            DeepseekTranslator,
            OpenAIlikedTranslator,
            QwenMtTranslator,
        ]:
            translater = None
            if service_name == translator.name:
                translater = translator(
                    lang_in, lang_out, service_model, envs=envs, prompt=prompt
                )
                break
        
        if translater is None:
            raise ValueError("Unsupported translation service")
        else:
            return translater
        