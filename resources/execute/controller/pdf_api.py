import asyncio
from concurrent.futures import ThreadPoolExecutor
from time import sleep
from flask import current_app, request, Blueprint
from model.config.chat_exception import ChatException
from model.data_result import DataResult

from model.request.translate_request import TranslateRequest
from services.pdf_service import PdfService
from utils.chatlog import logger
import traceback
import os
from flask import Flask, request, Response, stream_with_context
import json
from queue import Queue


pdf_api = Blueprint('pdf_api', __name__)

# 创建PDF解析线程池
parse_executor = ThreadPoolExecutor(max_workers=20)
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


        workid:str = PdfService.save_pdf_to_local(file=file)
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

    def generate():
        progress_queue = Queue()  # 创建进度队列
        cancellation_event = asyncio.Event()  # 创建取消事件

        # 定义普通回调函数，将数据存入队列
        def on_page_callback(current_page, total_pages):
            progress = int((current_page / total_pages) * 100)
            progress_queue.put({
                "status": "processing",
                "progress": progress,
                "current_page": current_page,
                "total_pages": total_pages,
                "msg": f"正在处理第 {current_page} 页"
            })

        # 在后台线程执行翻译任务
        def run_translate():
            try:
                translate_result = PdfService.translate(
                    file_path=translate_request.file_path,
                    lang_in=translate_request.from_lang,
                    lang_out=translate_request.to_lang,
                    service=translate_request.platform,
                    model_name=translate_request.model,
                    api_key=translate_request.api_key,
                    thread=4,
                    callback=on_page_callback,  # 传递普通回调
                    cancellation_event=cancellation_event  # 传递取消事件
                )
                final_result = {
                    "source": translate_request.file_path,
                    "target": translate_result,
                }
                progress_queue.put({"status": "completed", "process": 100, "result": final_result, "msg": "翻译完成"})
            except Exception as e:
                progress_queue.put({"status": "error", "message": str(e)})

        # 提交翻译任务到线程池
        parse_executor.submit(run_translate)

        try:
            # 从队列读取数据并生成 SSE
            while True:
                data = progress_queue.get()
                if data["status"] in ("completed", "error"):
                    yield f'data: {json.dumps(data, ensure_ascii=False)}\n\n'
                    break
                yield f'data: {json.dumps(data, ensure_ascii=False)}\n\n'
        finally:
            # 当前端关闭连接时，触发 finally 块
            logger.info("SSE connection closed by client")
            cancellation_event.set()  # 设置取消事件，终止翻译任务

    return Response(stream_with_context(generate()), content_type='text/event-stream')