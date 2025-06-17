import uuid
import hashlib
import re
from utils.chatlog import logger
from model.config.chat_exception import ChatException

class TextUtil():
    def __init__(self):
        pass

    @staticmethod
    def find_language(language_list):
        '''language_list是根据lang_detect计算后的语言列表,用于计算到底文本是那种语言,非英语超过21%则就是非英语'''
        language_counts = {}
        total_count = len(language_list)
        for language in language_list:
            if language in language_counts:
                language_counts[language] += 1
            else:
                language_counts[language] = 1
        en_count = language_counts.get('en', 0)
        if en_count == 0:
            return max(language_counts, key=language_counts.get)
        else:
            non_en_counts = [
                v for k, v in language_counts.items() if k != 'en']
            if any(non_en_counts) and max(non_en_counts) / sum(non_en_counts) > 0.21:
                return max([l for l in language_counts if l != 'en'], key=language_counts.get)
            else:
                return 'en'

    @staticmethod
    def uuid_gen():
        # 生成一个随机的 UUID
        random_uuid = uuid.uuid4()

        # 获取 UUID 的十六进制表示，并转换为小写字母的格式
        uuid_str = random_uuid.hex
        uuid_str_lower = uuid_str.lower()
        return uuid_str_lower

    @staticmethod
    def md5_gen(data: str) -> str:
        # 创建一个 MD5 哈希对象
        md5_obj = hashlib.md5()
        # 更新哈希对象的状态，添加需要进行哈希计算的字符串
        md5_obj.update(data.encode('utf-8'))
        # 计算并获取最终的哈希值
        md5_hex_str = md5_obj.hexdigest()
        return md5_hex_str

    @staticmethod
    def r_replace(source: str, fliter: str, target: str) -> str:
        '''把source最后末尾的fliter替换成target,如果末尾不是fliter的话 则不处理
        :param source 原始字符串
        :param fliter 要替换的字符串
        :param target 替换成的字符串
        '''
        last_n = source.rfind(fliter)  # 寻找最后一个 \n 的位置
        if last_n != -1 and last_n == len(source) - 1:  # 判断最后一个 \n 是否位于字符串结尾
            source = source[:last_n] + target  # 如果是结尾的 \n，则替换为 \n

        return source

    @staticmethod
    def filter_special_char(file_name: str) -> str:
        '''过滤文件名中的特殊字符，将不允许的字符替换为下划线并去除首尾空格和下划线'''
        # 定义Windows系统中不允许的文件名特殊字符，包括单引号、双引号、空格等
        special_chars = r"[\\/:*?\"<>|'‘’“” ]"
        # 将特殊字符替换为下划线
        filtered_name = re.sub(special_chars, '_', file_name)
        # 去除首尾的空格和下划线
        filtered_name = filtered_name.strip(' _')
        return filtered_name
