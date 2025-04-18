import asyncio
from concurrent.futures import ThreadPoolExecutor
from time import sleep
from flask import current_app, request, Blueprint
from httpx._transports import base
from model.config.chat_exception import ChatException
from model.data_result import DataResult
from services.config_dir import ConfigDir
from model.request.translate_request import TranslateRequest
from services.pdfmath_service import PdfMathService
from services.pdf_babel_service import PdfBabelSerive
from utils.chatlog import logger
import traceback
import os
from flask import Flask, request, Response, stream_with_context
import json
from queue import Queue
from config.ts_constants import TSCore,TSStatus


pdf_api = Blueprint('pdf_api', __name__)

# 创建PDF解析线程池
parse_executor = ThreadPoolExecutor(max_workers=20)
#创建一个翻译线程池,babeldoc多线程的话就有问题了
parse_babel_executor = ThreadPoolExecutor(max_workers=20)
#创建一个摘要总结线程池
summary_executor = ThreadPoolExecutor(max_workers=20)

#创建一个echo接口
@pdf_api.route("/echo", methods=['GET'])
def echo():
    return DataResult.ok('ok')
@pdf_api.route("/import", methods=['POST'])
def upload_pdf():
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            logger.warning("No file part")
            return DataResult.fail("No file part")

        file = request.files['file']

        # 检查文件名是否为空
        if file.filename == '':
            logger.warning("No selected file")
            return DataResult.fail("No selected file")

        # 检查文件是否为 PDF 格式
        if not file.filename.endswith('.pdf'):
            logger.warning("Invalid file type")
            return DataResult.fail("Invalid file type. Only PDF files are allowed.")

        # 获取cache_dir参数
        cache_dir = request.form.get('cache_dir')
        if not cache_dir:
            logger.warning("No cache_dir provided")
            return DataResult.fail("cache_dir is required")
        ConfigDir.init(base_dir = cache_dir)
        workid:str = PdfMathService.save_pdf_to_local(file=file)
        return DataResult.ok(workid)
        #return DataResult.ok('ok')

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f'An error occurred: {e}\nStack Trace: {tb}')
        return DataResult.reply_exception(str(e))

# 假设 pdf_api 是 Flask 的 Blueprint


@pdf_api.route("/translate", methods=['POST'])
def translate_pdf():
    data = request.json
    translate_request = TranslateRequest.from_dict(data)
    translate_engine:str = translate_request.translate_engine
    ConfigDir.init(base_dir = translate_request.cache_dir)
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
                target_file_name, source_file_name, total_page = PdfMathService.translate(
                    file_path=translate_request.file_path,
                    lang_in=translate_request.from_lang,
                    lang_out=translate_request.to_lang,
                    service=translate_request.platform,
                    model_name=translate_request.model,
                    api_key=translate_request.api_key,
                    thread=translate_request.threads,
                    base_url=translate_request.base_url,
                    callback=on_page_callback,
                    cancellation_event=cancellation_event 
                )
                final_result = {
                    "source": source_file_name,
                    "target": target_file_name,
                    "total_pages": total_page,
                    "core": TSCore.pdfmath,
                }
                progress_queue.put({"status": "completed", "process": 100, "result": final_result, "msg": "翻译完成"})
            except Exception as e:
                progress_queue.put({"status": "error", "message": str(e)})
        def run_babel_translate():
            try:
                file_url, target_file_name, source_base_name, total_page = PdfBabelSerive.translate(
                    file_path=translate_request.file_path,
                    lang_in=translate_request.from_lang,
                    lang_out=translate_request.to_lang,
                    service=translate_request.platform,
                    model_name=translate_request.model,
                    api_key=translate_request.api_key,
                    base_url=translate_request.base_url,
                    thread=translate_request.threads,
                    callback=on_page_callback,
                    cancellation_event=cancellation_event 
                )
                final_result = {
                    "source": source_base_name,
                    "target": target_file_name,
                    "total_pages": total_page,
                    "core": TSCore.babeldoc
                }
                progress_queue.put({"status": "completed", "process": 100, "result": final_result, "msg": "翻译完成"})
            except Exception as e:
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

    return Response(stream_with_context(generate()), content_type='text/event-stream')