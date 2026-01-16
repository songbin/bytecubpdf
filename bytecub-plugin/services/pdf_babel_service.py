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
from babeldoc.babeldoc_exception.BabelDOCException import ScannedPDFError
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
        system_prompt: str = "",  # 新增系统提示字段
        enable_clean: bool = False,  # 新增enable_clean字段
    ):
        skip_clean = not enable_clean
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
        term_dict=term_dict, engine=TSCore.babeldoc, system_prompt=system_prompt)
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
                skip_clean = skip_clean,
                save_auto_extracted_glossary = False,
            )
            
            result_path = asyncio.run(cls.__yadt_translate_coro(
                file_path = file,
                yadt_config=yadt_config,
                cancellation_event=cancellation_event, 
                callback=callback))
            return result_path
    @classmethod
    async def handle_progress_event(cls, event, callback):
        event_type = event.get("type", "")

        # Handle error_report events (non-fatal errors during translation)
        if event_type == "error_report":
            error_message = event.get("error", "Unknown error")
            errors_list_param = event.get("errors", [])
            stage = event.get("stage", "")
            if callback:
                try:
                    # Send error to SSE stream without stopping translation
                    callback(
                        current_page=-1,  # Error indicator
                        total_pages=1,
                        core=TSCore.babeldoc,
                        current_part=event.get("part_index", 0),
                        total_parts=event.get("total_parts", 1),
                        stage=stage,
                        overall_progress=0,
                        error_message=error_message,  # Individual error message
                        errors_list_param=errors_list_param  # All errors collected so far
                    )
                except Exception as cb_err:
                    logger.warning(f"Failed to send error_report via callback: {cb_err}")
            return

        # Handle progress events (progress_start, progress_update, progress_end)
        if event_type in ("progress_start", "progress_update", "progress_end"):
            current_page = event.get("stage_current", event.get("current", 0))
            total_pages = event.get("stage_total", event.get("total", 1))
            stage = event.get("stage", "")
            overall_progress = event.get("overall_progress", 0)
            part_index = event.get("part_index", 0)
            total_parts = event.get("total_parts", 1)

            if callback:
                callback(
                    current_page=current_page,
                    total_pages=total_pages,
                    core=TSCore.babeldoc,
                    current_part=part_index,
                    total_parts=total_parts,
                    stage=stage,
                    overall_progress=overall_progress
                )
            return

        # Handle fatal error events
        if event_type == "error":
            error_msg = event.get('error', 'Unknown error')
            error_str = str(error_msg) if not isinstance(error_msg, str) else error_msg
            if callback:
                try:
                    callback(
                        current_page=-1,
                        total_pages=1,
                        core=TSCore.babeldoc,
                        current_part=0,
                        total_parts=1,
                        stage="error",
                        overall_progress=0,
                        error_message=error_str
                    )
                except Exception as cb_err:
                    logger.warning(f"Failed to send error via callback: {cb_err}")
            return
    @classmethod 
    def handle_finish_event(cls, event):
        result = event["translate_result"]
        logger.info(f"###########Translation finished: {result}")
        logger.info(f"#############Translation finished: {result.mono_pdf_path}")
        dual_out_file_name = Path(result.dual_pdf_path).name if result.dual_pdf_path else None
        return (
            str(result.mono_pdf_path),
            result.mono_out_file_name,
            result.source_base_name,
            dual_out_file_name,
            result.total_pages
        )
    @classmethod
    async def __yadt_translate_coro(cls, file_path= None, yadt_config=None, cancellation_event=None, callback = None):
                progress_context, progress_handler = create_progress_handler(yadt_config)
                # 开始翻译
                with progress_context:
                    try:
                        async for event in yadt_translate(yadt_config):
                            logger.info(f"[SSE] Event received: {event.get('type', 'unknown')}")
                            progress_handler(event)
                            # 检查是否取消
                            if cancellation_event and cancellation_event.is_set():
                                raise Exception("Translation cancelled by user")
                            # 处理所有事件类型
                            if callback:
                                try:
                                    await cls.handle_progress_event(event, callback)
                                    logger.info(f"[SSE] Event {event.get('type')} processed successfully")
                                except Exception as pe:
                                    logger.warning(f"Progress event handler failed: {pe}")
                            # 处理致命错误事件（需要终止翻译）
                            if event["type"] == "error":
                                error_msg = event['error']
                                # 提取错误信息的字符串表示
                                error_str = str(error_msg) if not isinstance(error_msg, str) else error_msg

                                # 然后抛出异常以终止翻译
                                if isinstance(error_msg, ScannedPDFError):
                                    raise ScannedPDFError("Scanned PDF detected, please enable OCR recognition")
                                else:
                                    logger.error_ext(f"Translation failed: {error_str}")
                                    # 将错误信息包装成更详细的异常
                                    raise Exception(f"翻译过程中发生错误: {error_str}") from error_msg if isinstance(error_msg, Exception) else Exception(error_str)
                            # 处理完成事件
                            if event["type"] == "finish":
                                try:
                                    return cls.handle_finish_event(event)
                                except Exception as fe:
                                    logger.warning(f"Finish event handler failed: {fe}")
                                #break
                    except ScannedPDFError as spe:
                        # 特殊处理扫描版PDF错误
                        logger.error_ext(f"Scanned PDF error: {spe}")
                        raise
                    except Exception as e:
                        # 捕获所有其他异常并记录详细日志
                        logger.error_ext(f"Translation failed with error: {str(e)}")
                        logger.error_ext(f"Error type: {type(e).__name__}")
                        # 重新抛出异常,确保能够传播到上层
                        raise

    @classmethod
    def __query_platform( cls, service_name:str,lang_in, lang_out, service_model, envs, prompt):
        from pdf2zh.translator import (
        OllamaTranslator,
        OpenAITranslator,
        SiliconFlowFreeTranslator,
    )

        for translator in [
            OllamaTranslator, 
            OpenAITranslator,
            SiliconFlowFreeTranslator,
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
        