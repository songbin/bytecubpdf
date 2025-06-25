import asyncio
from concurrent.futures import ThreadPoolExecutor
from time import sleep
from sse_starlette.sse import EventSourceResponse
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config.ts_constants import TSConstants,UploadBiz
from httpx._transports import base
from ai_enginee.models import chat_request
from model.config.chat_exception import ChatException
from model.data_result import DataResult
from model.request import ocr_request
from services.config_dir import ConfigDir
from model.request.translate_request import TranslateRequest
from model.request.ocr_request import OcrRequest
from services.pdfmath_service import PdfMathService
from services.pdf_babel_service import PdfBabelSerive
from utils.chatlog import logger
import traceback
from babeldoc.babeldoc_exception.BabelDOCException import ScannedPDFError
import os
import json
from queue import Queue
from config.ts_constants import TSCore,TSStatus
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.agents.entry_agnet import EntryAgent
from services.ocr_md_service import OcrMdService
from typing import Optional
from model.config.error_info import ErrorInfo
from utils.pdf_util import PdfUtil

router = APIRouter()

# 创建PDF解析线程池
parse_executor = ThreadPoolExecutor(max_workers=20)
#创建一个翻译线程池,babeldoc多线程的话就有问题了
parse_babel_executor = ThreadPoolExecutor(max_workers=20)
#创建一个摘要总结线程池
summary_executor = ThreadPoolExecutor(max_workers=20)


class VerifyPdfMode(BaseModel):
    file_path: str
class TranslateRequestModel(BaseModel):
    file_path: str
    sourceLanguage: str
    targetLanguage: str
    platform: str
    model: str
    apiKey: str
    base_url: str
    threads: int
    cache_dir: str
    translate_engine: str
    term_dict: Optional[dict] = None
    max_pages: Optional[int] = 0
    enable_ocr: Optional[bool] = False
    disable_rich_text: Optional[bool] = False
    enable_table: Optional[bool] = False,
    enbale_dual: Optional[bool] = False,

class OcrRequestModel(BaseModel):
    file_path: str
    platform: str
    model: str
    apiKey: str
    base_url: str
    threads: int
    cache_dir: str
    term_dict: Optional[dict] = None
    max_pages: Optional[int] = 0
    layoutDirection: str
    enabaleSentence:bool
    enableVertical:bool
    enableConvert:bool
class PdfController:
    router = APIRouter()
    
    def __init__(self):
        
        
        self.router.add_api_route(
            path="/pdf/echo",
            endpoint=self.echo,
            methods=["GET"],
            summary="同步对话接口",
            response_description="返回同步对话响应",
            operation_id="chat_post"
        )
        
        self.router.add_api_route(
            path="/pdf/import",
            endpoint=self.upload_pdf,
            methods=["POST"],
            summary="流式对话接口",
            response_description="返回SSE流式响应",
            operation_id="import"
        )

        self.router.add_api_route(
            path="/pdf/sse_chat",
            endpoint=self.sse_chat,
            methods=["POST"],
            summary="测试对话接口",
            response_description="测试对话接口",
            operation_id="sse_chat"
        )
        self.router.add_api_route(
            path="/pdf/translate",
            endpoint=self.translate_pdf,
            methods=["POST"],
            summary="测试对话接口",
            response_description="测试对话接口",
            operation_id="translate"
        )

        self.router.add_api_route(
            path="/pdf/verifypdf",
            endpoint=self.verify_pdf,
            methods=["POST"],
            summary="校验pdf是不是扫描版",
            response_description="校验pdf是不是扫描版",
            operation_id="verifypdf"
        )
        
  
    def echo(self):
        return DataResult.ok('ok')
 
    async def upload_pdf(self,file: UploadFile = File(...), 
                            cache_dir: str = Form(...), biz: str = Form(...)):
        try:
            # 检查文件名是否为空
            if file.filename == '':
                logger.warning("No selected file")
                return DataResult.fail("No selected file")
             # 检查upload_biz字段是否有效
            if not biz:
                logger.warning("Missing required field: upload_biz")
                return DataResult.fail("upload_biz is required")
            #如果biz是UploadBiz.ocr: 如果是这个则允许后缀为.pdf .jpg .jpeg .png，否则允许后缀为.pdf
            if biz == UploadBiz.ocr:
                if not file.filename.lower().endswith(('.pdf', '.jpg', '.jpeg', '.png')):
                    logger.warning("Invalid file type")
                    return DataResult.fail("Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.")
            else:
                if not file.filename.lower().endswith('.pdf'):
                    logger.warning("Invalid file type")
                    return DataResult.fail("Invalid file type. Only PDF files are allowed.")
            
            # # 检查文件是否为 PDF 格式
            # if not file.filename.lower().endswith('.pdf'):
            #     logger.warning("Invalid file type")
            #     return DataResult.fail("Invalid file type. Only PDF files are allowed.")

           

            # 检查缓存目录是否存在
            if not cache_dir:
                logger.warning("No cache_dir provided")
                return DataResult.fail("cache_dir is required")

            # 初始化配置目录并保存PDF文件
            ConfigDir.init(base_dir = cache_dir)
            try:
                 
                workid = await PdfMathService.save_pdf_to_local(file = file, biz=biz)
                return DataResult.ok(workid)
            except Exception as e:
                logger.error(f'文件保存失败: {str(e)}')
                return DataResult.fail('文件保存失败，请重试')

        except Exception as e:
            tb = traceback.format_exc()
            logger.error(f'An error occurred: {e}\nStack Trace: {tb}')
            return DataResult.reply_exception(str(e))

 
    async def sse_chat(self, request:OcrRequestModel):
       
            try:
                # data = request.json
                ocr_request = request
                ConfigDir.init(base_dir=ocr_request.cache_dir)
                chat_request = OcrMdService.build_chat_request(
                    file_path=ocr_request.file_path,
                    platform=ocr_request.platform,
                    model=ocr_request.model,
                    api_key=ocr_request.apiKey,
                    base_url=ocr_request.base_url,
                    cache_dir=ocr_request.cache_dir,
                    threads=ocr_request.threads,
                    layoutDirection=ocr_request.layoutDirection,
                    enabaleSentence=ocr_request.enabaleSentence,
                    enableVertical=ocr_request.enableVertical,
                    enableConvert= ocr_request.enableConvert,
                )
                entryAgent = EntryAgent(chat_request, is_stream=True)
                return EventSourceResponse(
                    # stream_generator(),
                    # event_stream,
                    entryAgent.sse_execute(),
                    media_type="text/event-stream; charset=utf-8",
                    headers={
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive"
                    }
                )
            except Exception as e:
                logger.warning_ext("请求处理失败")
                async def error_stream():
                    
                    yield f"data: {json.dumps({'data': None, 'code': 500, 'msg': '内部错误'})}\n\n"
                    yield "data: [DONE]\n\n"
                return EventSourceResponse(error_stream(), media_type="text/event-stream; charset=utf-8")

         

    def verify_pdf(self, request: VerifyPdfMode):
        pdf_path:str = request.file_path
        is_scanned = PdfUtil.verify_pdf_is_scanned(pdf_path)
        if is_scanned:
            return DataResult.fail(msg=ErrorInfo.msg_verify_pdf, code=ErrorInfo.code_verify_pdf)
        else:
            return DataResult.ok()
         
    def translate_pdf(self, request: TranslateRequestModel):
        translate_engine:str = request.translate_engine
        ConfigDir.init(base_dir = request.cache_dir)
        logger.info(f"translate_request: {request.__repr__()}")
        def generate():
            progress_queue = Queue()  
            cancellation_event = asyncio.Event()  

            def on_page_callback(
                current_page, 
                total_pages, 
                stage = '', 
                overall_progress=0,
                core=TSCore.pdfmath,
                current_part=0,
                total_parts=0,
                status=TSStatus.processing,
                target_file='',
                source_file='',
                ):
                current_status = TSStatus.processing,
                if core == TSCore.pdfmath:
                    progress = int((current_page / total_pages) * 100)
                    progress = int(progress * 0.9)
                    current_status = "processing"
                    msg = f"正在处理第 {current_page} 页"
                elif core == TSCore.babeldoc:
                    progress = int(overall_progress)
                    current_status = status
                    current_page = current_part
                    total_pages = total_parts
                    msg = f"正在处理部分 "

                msg = f"正在处理第 {current_page} 页"
                if core == TSCore.babeldoc:
                    msg = f"正在处理部分 {current_page}/{total_pages}"
                progress_queue.put({
                    "status": current_status,
                    "progress": progress,
                    "stage": stage,
                    "current_page": current_page,
                    "total_pages": total_pages,
                    "core": core,
                    "msg": msg
                })

            def run_translate():
                try:
                    no_dual = True
                    if request.enbale_dual:
                        no_dual = False
                    target_file_name, source_file_name,dual_file_name, total_page = PdfMathService.translate(
                        file_path=request.file_path,
                        lang_in=request.sourceLanguage,
                        lang_out=request.targetLanguage,
                        service=request.platform,
                        model_name=request.model,
                        api_key=request.apiKey,
                        thread=request.threads,
                        base_url=request.base_url,
                        callback=on_page_callback,
                        cancellation_event=cancellation_event,
                        term_dict=request.term_dict,
                        no_dual = no_dual,  # 新增禁用双页翻译字段
                    )
                    dual_file_name = dual_file_name if dual_file_name else ''
                    final_result = {
                        "source": source_file_name,
                        "target": target_file_name,
                        "dual_file_name": dual_file_name,
                        "total_pages": total_page,
                        "core": TSCore.pdfmath,
                    }
                    progress_queue.put({"status": "completed", "process": 100, "result": final_result, "msg": "翻译完成"})
                except Exception as e:
                    logger.error_ext(f"An error occurred: {e}")
                    progress_queue.put({"status": "error", "message": str(e)})
            def run_babel_translate():
                try:
                    no_dual = True
                    if request.enbale_dual:
                        no_dual = False
                    file_url, target_file_name, source_base_name, dual_file_name, total_page = PdfBabelSerive.translate(
                        file_path=request.file_path,
                        lang_in=request.sourceLanguage,
                        lang_out=request.targetLanguage,
                        service=request.platform,
                        model_name=request.model,
                        api_key=request.apiKey,
                        base_url=request.base_url,
                        thread=request.threads,
                        callback=on_page_callback,
                        cancellation_event=cancellation_event ,
                        term_dict=request.term_dict,
                        max_pages = request.max_pages,  # 新增每页最大页数字段
                        enable_ocr = request.enable_ocr,  # 新增OCR识别字段
                        disable_rich_text = request.disable_rich_text,  # 新增禁用富文字段
                        enable_table = request.enable_table,  # 新增表格翻译字段
                        no_dual = no_dual
                    )
                    dual_file_name = dual_file_name if dual_file_name else ''
                    final_result = {
                        "source": source_base_name,
                        "target": target_file_name,
                        "total_pages": total_page,
                        "core": TSCore.babeldoc,
                        "dual_file_name": dual_file_name,
                    }
                    progress_queue.put({"status": "completed", "process": 100, "result": final_result, "msg": "翻译完成"})
                except ScannedPDFError as spe:
                    logger.error_ext(f"An error occurred: {spe}")
                    progress_queue.put({"status": "error", "message": "检测到可能是OCR识别的PDF，请开启【消除重影】再次尝试"})
                except Exception as e:
                    logger.error_ext(f"An error occurred: {e}")
                    progress_queue.put({"status": "error", "message": str(e)})
            # 提交翻译任务到线程池
            match translate_engine:
                case TSCore.pdfmath:
                    logger.info(f"pdfmath run")
                    parse_executor.submit(run_translate)
                case TSCore.babeldoc:
                    logger.info(f"pdfbabel run")
                    parse_babel_executor.submit(run_babel_translate)
                    # run_babel_translate()
                case _:
                    logger.info(f"default run")
                    parse_executor.submit(run_translate)

            try:
                # 从队列读取数据并生成 SSE
                while True:
                    data = progress_queue.get()
                    # logger.info(f"Received data: {data}")
                    event_data = json.dumps(data, ensure_ascii=False)
                    if data["status"] in ("completed", "error"):
                        yield f'data: {event_data}\n\n'
                        break
                    yield f'data: {event_data}\n\n'
            finally:
                # 当前端关闭连接时，触发 finally 块
                logger.info("SSE connection closed by client")
                cancellation_event.set()  # 设置取消事件，终止翻译任务

        return StreamingResponse(generate(), media_type='text/event-stream')