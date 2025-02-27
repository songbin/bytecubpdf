import asyncio
from concurrent.futures import ThreadPoolExecutor
import datetime
from io import BytesIO
import os
import traceback
from typing import Dict
from config.ts_constants import TSConstants
from model.config.chat_exception import ChatException
from pdf2zh.doclayout import  ModelInstance
from pdf2zh.high_level import translate
from utils.chatlog import logger

from utils.file_util import FileTool
from utils.text_util import TextUtil
from model.data_result import DataResult
from utils.time_util import TimeUtil

class PdfService:
    def __init__(self, pdf_file):
        self.pdf_file = pdf_file

    def extract_text(self):
        # Implement the logic to extract text from the PDF file
        pass
    @classmethod
    def save_pdf_to_local(cls, file):
        try:
            # 获取当前工程目录下的 upload_folder 路径
            save_path = os.path.join(os.getcwd(), TSConstants.upload_folder)
            
            # 如果路径不存在，则创建
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            
            # 获取文件名（不带扩展名）和扩展名
            file_name, file_extension = os.path.splitext(file.filename)
            
            # 获取当前时间并格式化为 "年月日时分秒"
            current_time = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            
            # 拼接新的文件名
            new_file_name = f"{file_name}{current_time}{file_extension}"
            
            # 拼接完整的文件路径
            full_path = os.path.join(save_path, new_file_name)
            
            # 保存文件
            with open(full_path, 'wb') as f:
                f.write(file.read())
            
            logger.info(f"文件已成功保存到: {full_path}")
            return full_path
        
        except Exception as e:
            logger.error(f"保存文件时发生错误: {e}")
            logger.error(traceback.format_exc())
            raise ChatException("保存文件时发生错误")
    @classmethod
    def translate(
        cls,
        file_path: str,
        lang_in: str = "",
        lang_out: str = "",
        service: str = "",
        model_name: str = "",
        api_key: str = "",
        thread: int = 4,
        callback = None,
        cancellation_event=None, 
    ):
        save_path = os.path.join(os.getcwd(), TSConstants.translate_folder)
            
        # 如果路径不存在，则创建
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        envs = cls._build_envs(service, model_name, api_key)
        param = {
            "files": [file_path],
            "pages": None,
            "lang_in": lang_in,
            "lang_out": lang_out,
            "service": service,
            "output": save_path,
            "thread": int(4),
            "callback": callback,
            "cancellation_event": cancellation_event,
            "envs": envs,
            "prompt": None,
            "model": ModelInstance.value,
        }
        try:
            translate_pdf = translate(**param)
            return translate_pdf
        except Exception as e:
            logger.warning_ext(f"翻译文件时发生错误: {e}")
            raise ChatException("Translation cancelled")
        
    @classmethod
    def _build_envs(cls, service:str, model_name:str, api_key:str) -> Dict:
        envs = {}
        if service == "zhipu":
            envs = {
                'ZHIPU_API_KEY': api_key,
                'ZHIPU_MODEL': model_name,
            }
        elif service == "deepseek":
            envs = {
                'DEEPSEEK_API_KEY': api_key,
                'DEEPSEEK_MODEL': model_name,
            }
        return envs