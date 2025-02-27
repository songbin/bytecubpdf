import os
import shutil
import traceback
from utils.chatlog import logger
import hashlib
from io import BytesIO
from werkzeug.utils import secure_filename

class FileTool:
    @staticmethod
    def calc_file_md5(file_path):
        """
        计算文件的 MD5 值
        :param file_path: 文件路径
        :return: 文件的 MD5 值
        """
        with open(file_path, 'rb') as f:
            md5_obj = hashlib.md5()
            while True:
                data = f.read(1024 * 1024)
                if not data:
                    break
                md5_obj.update(data)
        return md5_obj.hexdigest()
    
    @staticmethod
    def read_filename(request_data):
        filename = secure_filename(request_data.filename)
    
    @staticmethod
    def calc_request_file_md5(request_data):
        """
        计算从 HTTP 请求体中获取的文件的 MD5 值
        :param request_data: HTTP 请求体数据
        :return: 文件的 MD5 值
        """
        # 获取上传的文件名
        filename = secure_filename(request_data.filename)

        # 读取文件内容到内存中
        file_content = BytesIO(request_data.read())

        # 计算文件的MD5值
        md5_obj = hashlib.md5()
        while True:
            data = file_content.read(1024 * 1024)
            if not data:
                break
            md5_obj.update(data)
        request_data.seek(0)  # 重置文件指针
        return md5_obj.hexdigest()
    
    @staticmethod
    def calc_md5_from_bytesio(file_io):
        """
        计算 BytesIO 对象中数据的 MD5 值
        :param file_io: BytesIO 对象
        :return: 数据的 MD5 值
        """
        md5_obj = hashlib.md5()
        while True:
            data = file_io.read(1024 * 1024)
            if not data:
                break
            md5_obj.update(data)
        return md5_obj.hexdigest()
    
    @staticmethod
    def remove_dir(dir_path):
        try:
            if os.path.exists(dir_path):
                shutil.rmtree(dir_path)
        except Exception as e:
            logger.error(f"Error removing directory {dir_path}: {e}")
            tb = traceback.format_exc()
            logger.warning(f'Error removing directory {dir_path} : {e}\nStack Trace: {tb}')
        