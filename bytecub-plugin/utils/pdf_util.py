from utils.chatlog import logger
import fitz
import io
import os
import pdfminer
from io import BytesIO
from model.global_model import FilePage


class PdfUtil:
    def __init__(self):
        self.pdf = None
        logger.info('init PdfUtil')

    def extract_text_from_bytesio(self, pdf_bytesio):
        text = self.extract_text_from(pdf_bytesio)
        return text

    # 使用fitz读取pdf文件
    @staticmethod
    def get_pdf_text(md5, pdf_bytes):
        logger.info(f'reader file start, file md5:{md5}')
        # 将 BytesIO 对象转换为 bytes 字节串
        pdf_data = pdf_bytes.getvalue()
        pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
        text_pages = []
        for i in range(pdf_document.page_count):
            logger.info(
                f'reader file page {i} page total:{pdf_document.page_count}, file md5:{md5}')
            page = pdf_document[i]
            text = page.get_text()
            text_pages.append({"text": text, "page": i})
        return text_pages

    @staticmethod
    def get_pdf_text_file(path: str) -> str:
        # file_org = open(path, 'rb')
        # file = BytesIO(file_org.read())
        pdf_document = fitz.open(path)
        doc: str = ''
        for i in range(pdf_document.page_count):
            page = pdf_document[i]
            text = page.get_text()
            doc += text
        return doc

    # 使用fitz读取pdf文件
    @staticmethod
    def get_page_from_pdf(md5, pdf_bytes) -> list[FilePage]:
        '''
        使用fitz按页读取pdf内容,每一页作为元素组成list返回
        '''
        logger.info(f'reader file start, file md5:{md5}')
        # 将 BytesIO 对象转换为 bytes 字节串
        pdf_data = pdf_bytes.getvalue()
        pdf_document = fitz.open(stream=pdf_data, filetype="pdf")
        text_pages: list[FilePage] = []
        for i in range(pdf_document.page_count):
            # logger.info(
            #     f'reader file page {i} page total:{pdf_document.page_count}, file md5:{md5}')
            page = pdf_document[i]
            text = page.get_text()
            file_page = FilePage(i+1, text)
            text_pages.append(file_page)
        return text_pages
    @staticmethod
    def verify_pdf_is_scanned(pdf_path: str) -> bool:
        '''
        校验pdf是否是扫描版
        如果有2页字符数小于10就判定为扫描件
        '''
        try:
            pdf_document = fitz.open(pdf_path)
            low_text_pages = 0
            # 最多检测前8页
            for i in range(min(pdf_document.page_count, 8)):
                page = pdf_document[i]
                text = page.get_text()
                logger.info(f'verify pdf is scanned page {i} text: {text}')
                cleaned_text = text.replace(" ", "").replace("\n", "")
                if len(cleaned_text) < 200:
                    low_text_pages += 1
                    if low_text_pages >= 2:
                        return True
            return low_text_pages >= 2
        except Exception as e:
            logger.error(f'verify pdf is scanned error: {e}')
            return False
     

    