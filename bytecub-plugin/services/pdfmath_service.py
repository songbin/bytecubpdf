import asyncio
from concurrent.futures import ThreadPoolExecutor
import datetime
from io import BytesIO
import os
import traceback
from typing import Dict
from config.ts_constants import TSConstants,UploadBiz
from model.config.chat_exception import ChatException
from pdf2zh.doclayout import  ModelInstance,OnnxModel
from pdf2zh.high_level import translate
from utils.chatlog import logger
from string import Template
from utils.file_util import FileTool
from utils.text_util import TextUtil
from model.data_result import DataResult
from utils.time_util import TimeUtil 
from config.ts_constants import TSCore, ENVDict
class PdfMathService:
    def __init__(self, pdf_file):
        self.pdf_file = pdf_file

    def extract_text(self):
        # Implement the logic to extract text from the PDF file
        pass
    @classmethod
    async def save_pdf_to_local(cls, file, biz = UploadBiz.ocr):
        try:
            # 获取当前工程目录下的 upload_folder 路径
            save_path = os.path.join(os.getcwd(), TSConstants.upload_folder)
            if biz == UploadBiz.ocr:
                #获取文件名后缀
                file_name, file_extension = os.path.splitext(file.filename.lower())
                if file_extension in ('.jpg', '.jpeg', '.png'):
                     save_path = os.path.join(os.getcwd(), TSConstants.upload_ocr_image_folder)
                elif file_extension in ('.pdf'):
                    save_path = os.path.join(os.getcwd(), TSConstants.upload_folder)
                
                
            # 如果路径不存在，则创建
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            
            # 获取文件名（不带扩展名）和扩展名
            file_name, file_extension = os.path.splitext(file.filename)
            #把文件名你的特殊字符串全部过滤掉
            file_name = TextUtil.filter_special_char(file_name)
            
            # 获取当前时间并格式化为 "年月日时分秒"
            current_time = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            
            # 拼接新的文件名
            new_file_name = f"{file_name}{current_time}{file_extension}"
            
            # 拼接完整的文件路径
            full_path = os.path.join(save_path, new_file_name)
            
            # 保存文件
            with open(full_path, 'wb') as f:
                f.write(await file.read())
            
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
        base_url: str = "",
        thread: int = 4,
        callback = None,
        cancellation_event=None,
        term_dict = None,
        no_dual: bool = True,  # 新增禁用双页翻译字段
    ):
        save_path = os.path.join(os.getcwd(), TSConstants.translate_folder)
        if not ModelInstance.value:
            ModelInstance.value = OnnxModel.load_available()    
        # 如果路径不存在，则创建
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        
        
        envs = cls._build_envs(service, model_name, api_key,base_url, 
        term_dict=term_dict, engine=TSCore.pdfmath)
        
        
        param = {
            "files": [file_path],
            "pages": None,
            "lang_in": lang_in,
            "lang_out": lang_out,
            "service": service,
            "output": save_path,
            "thread": thread,
            "callback": callback,
            "cancellation_event": cancellation_event,
            "envs": envs,
            "prompt": None,
            "model": ModelInstance.value,
            "no_dual": no_dual,
        }
        try:
            translate_pdf = translate(**param)
            return translate_pdf
        except Exception as e:
            logger.warning_ext(f"翻译文件时发生错误: {e}")
            raise ChatException("Translation cancelled")
        
    @classmethod
    def _build_envs(cls, service:str, model_name:str, 
    api_key:str, base_url:str, term_dict:dict = {}, engine:str = '') -> Dict:
        # 先构建基础配置
        envs = {
            ENVDict.TERM_DICT: term_dict,
            ENVDict.ENGINE: engine
        }
        
        # 根据服务类型添加特定配置
        service_configs = {
            "openai": {
                "OPENAI_BASE_URL": base_url,
                "OPENAI_API_KEY": api_key,
                "OPENAI_MODEL": model_name,
            },
            "ollama": {
                "OLLAMA_HOST": base_url,
                "OLLAMA_MODEL": model_name,
            },
            "zhipu": {
                'ZHIPU_API_KEY': api_key,
                'ZHIPU_MODEL': model_name,
            },
            "deepseek": {
                'DEEPSEEK_API_KEY': api_key,
                'DEEPSEEK_MODEL': model_name,
            },
            "silicon": {
                'SILICON_API_KEY': api_key,
                'SILICON_MODEL': model_name,
            }
        }
        
        # 合并配置
        if service in service_configs:
            envs.update(service_configs[service])
            # envs['TERM_DICT'] = term_dict
            
        return envs