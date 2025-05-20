from functools import total_ordering
import os
import re
import base64
import asyncio
import shutil
from typing import List, Tuple, Optional, Dict, AsyncGenerator
from unittest import result
import fitz
import shapely.geometry as sg
from shapely.geometry.base import BaseGeometry
from shapely.validation import explain_validity
import logging
from openai import OpenAI
from abc import ABC, abstractmethod
from ai_enginee.agents.agent import Agent
from ai_enginee.model_util import sse_output
from ai_enginee.models.chat_request import ChatRequest
from config.ts_constants import TSConstants, TSCore,TSStatus,LLM_SUPPORT,AGENT_EXPAND_KEY,Layout_Direction
from ai_enginee.model_util.sse_output import SSEOutput
from utils.markdown_to_word_converter import MarkdownToWordConverter
from utils.chatlog import logger
from ai_enginee.enums.error_enum import ErrorEnum
import hashlib
import datetime
import ollama
from typing import Tuple
# 导入并发模块
import concurrent.futures
import json
from ai_enginee.models.llm_res.llm_response import LLMResponse
# This Default Prompt Using Chinese and could be changed to other languages.

DEFAULT_PROMPT = """使用markdown语法，将图片中识别到的文字转换为markdown格式输出。你必须做到：
1. 输出和使用识别到的图片的相同的语言，例如，识别到英语的字段，输出的内容必须是英语。
2. 不要解释和输出无关的文字，直接输出图片中的内容。例如，严禁输出 "以下是我根据图片内容生成的markdown文本："这样的例子，而是应该直接输出markdown。
3. 内容不要包含在```markdown ```中、段落公式使用 $$ $$ 的形式、行内公式使用 $ $ 的形式、忽略掉长直线、忽略掉页码。
再次强调，不要解释和输出无关的文字，直接输出图片中的内容。
"""
DEFAULT_RECT_PROMPT = """图片中用红色框和名称(%s)标注出了一些区域。如果区域是表格或者图片，使用 ![]() 的形式插入到输出内容中，否则直接输出文字内容。
"""
DEFAULT_ROLE_PROMPT = """你是一个PDF文档解析器，使用markdown和latex语法输出图片的内容。
"""

class ProcessInfo:
    """
    用于保存处理过程中的信息
    """
    def __init__(self, progress: float, msg: str, md_file:str = None, 
    docx_file:str = None, source_file:str = None, total_pages:int = None, 
    file_type:str = None,
    error:bool = False):
        self.progress = progress
        self.msg = msg
        self.md_file = md_file
        self.docx_file = docx_file
        self.source_file = source_file
        self.total_pages = total_pages
        self.file_type = file_type
        self.error = error
    def to_dict(self):
        return {
            "progress": self.progress,
            "msg": self.msg,
            "md_file": self.md_file,
            "docx_file": self.docx_file,
            "source_file": self.source_file,
            "total_pages" : self.total_pages,
            "file_type" : self.file_type,
            "error": self.error
        }
    def dumps(self):
        return json.dumps(self.to_dict(), ensure_ascii=False)
    
class TlImageToMdAgent(Agent):
    """
    图片转Markdown格式的Agent
    """
    name = '图片转Markdown格式'
    description = '将PDF或图片中的内容转换为Markdown格式'
    code = 'image_to_md'
    sseOutput = SSEOutput()
    work_process = 0
    #标记是否主动结束
    stop_flag = False 
    def __init__(self, request:ChatRequest = None):
        super().__init__(request)
        
    async def parse_pdf(self,
        pdf_path: str,
        output_dir: str = './',
        output_filename: str = None,
        docx_output_filename: str = None,
        prompt = DEFAULT_PROMPT,
        rect_prompt = DEFAULT_RECT_PROMPT,
        role_prompt = DEFAULT_ROLE_PROMPT,
    ) -> AsyncGenerator[str, None]:
        """
        异步解析PDF文件到markdown文件。
        直接将整页PDF截图发送给大模型进行处理，不再进行区域解析。
        使用多线程并发处理图片，提高处理效率。
        @param pdf_path: PDF文件路径
        @param output_dir: 输出目录
        @return: 异步生成markdown内容
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        request:ChatRequest = self.request
        # 处理生成器返回值
        image_infos = []
        # 实时处理生成器返回的每个值
        try:
            async for progress in self._parse_pdf_to_images(pdf_path, output_dir=output_dir):
                # 无论是进度信息还是最终结果，都先yield出去实时显示
                
                if isinstance(progress, str):
                    yield progress
                # 确保异步事件循环有机会处理这个yield
                await asyncio.sleep(0)  
                # 只有当progress是图片信息列表时才保存
                if not isinstance(progress, str):
                    image_infos = progress
                    
                # 检查取消标志
                if self.stop_flag:
                    logger.info("检测到停止标志，中断_parse_pdf_to_images处理")
                    break
        except asyncio.CancelledError:
            logger.info("在提取PDF图片过程中检测到取消任务信号")
            self.stop_flag = True
            yield ProcessInfo(progress=self.work_process, msg="任务已取消", error=True).dumps()
            return
        
        # 保存解析后的markdown文件
        # 这个父目录就是ocr md保存目录
        parent_dir = os.path.dirname(output_dir)
        output_path = os.path.join(parent_dir, output_filename)
        docx_output_path = os.path.join(TSConstants.upload_ocr_result_docx_folder, docx_output_filename)
        # 创建用于跟踪进度的队列和计数器
        progress_queue = asyncio.Queue()
        total_pages = len(image_infos)
        completed_pages = 0
        contents = [None] * total_pages
        
        # 定义回调函数来处理完成的页面
        def process_page_callback(future):
            nonlocal completed_pages
            try:
                page_index, page_content = future.result()
                if page_index < len(contents):
                    contents[page_index] = page_content
                # 将结果放入队列以便异步处理
                progress_queue.put_nowait((page_index, page_content))
            except Exception as e:
                # 将错误信息放入队列
                progress_queue.put_nowait((-1, f"处理出错: {str(e)}"))
        
        # 创建任务列表
        tasks = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(os.cpu_count(), total_pages, 4)) as executor:
            # 提交所有页面处理任务
            for index, image_info in enumerate(image_infos):
                if self.stop_flag:
                    logger.info("检测到停止标志，终止处理队列")
                    break
                self.work_process = 30
                yield ProcessInfo(progress=self.work_process, msg=f"提交处理任务: 第{index + 1}/{total_pages}页").dumps()
                # 创建处理任务
                future = executor.submit(self._process_page, index, image_info)
                future.add_done_callback(process_page_callback)
                tasks.append(future)
            
            # 异步处理结果队列
            while completed_pages < total_pages and not self.stop_flag:
                # 等待队列中的新结果
                try:
                    # 使用超时以防止无限等待
                    page_index, page_content = await asyncio.wait_for(progress_queue.get(), timeout=10)
                    if page_index == -1:  # 错误情况
                        yield f"错误: {page_content}"
                    else:
                        completed_pages += 1
                        # 实时推送单页结果
                        self.work_process = 50
                        yield ProcessInfo(progress=self.work_process, msg=f"已完成{completed_pages}/{total_pages}页识别").dumps()
                except asyncio.CancelledError:
                    logger.info("在等待处理结果时收到取消信号")
                    self.stop_flag = True
                    # 取消所有未完成的任务
                    for task in tasks:
                        if not task.done():
                            task.cancel()
                    yield ProcessInfo(progress=self.work_process, msg="任务已取消", error=True).dumps()
                    return
                except asyncio.TimeoutError:
                    # 检查是否所有任务都已完成
                    all_done = all(future.done() for future in tasks)
                    if all_done and completed_pages >= total_pages:
                        break
                
                if self.stop_flag:
                    logger.info("检测到停止标志，终止处理队列")
                    break
        
        # 检查是否已取消
        if self.stop_flag:
            logger.info("在生成文件前检测到停止标志，终止处理")
            return
            
        # 将所有处理后的内容写入文件
        self.work_process = 70
        try:
            yield ProcessInfo(progress=self.work_process, msg="正在生成md文件...", md_file=output_path).dumps()
            with open(output_path, 'w', encoding='utf-8') as f:
                # 过滤掉可能的None值
                valid_contents = [c for c in contents if c is not None]
                if valid_contents:
                    f.write('\n\n'.join(valid_contents))
                else:
                    f.write('未识别到任何内容')
            
            # 检查是否已取消
            if self.stop_flag:
                logger.info("在生成md文件后检测到停止标志，终止处理")
                return
                
            self.work_process = 80
            yield ProcessInfo(progress=self.work_process, msg="正在生成docx文件...", docx_file=docx_output_path).dumps()
            converter = MarkdownToWordConverter(output_path, docx_output_path)
            converter.convert()
            
            # 检查是否已取消
            if self.stop_flag:
                logger.info("在生成docx文件后检测到停止标志，终止处理")
                return
                
            # 删除图片文件夹
            self.work_process = 90
            yield ProcessInfo(progress=self.work_process, msg="正在删除临时文件...").dumps()
            if os.path.exists(output_dir):
                import shutil
                shutil.rmtree(output_dir)
            
            # 检查是否已取消
            if self.stop_flag:
                logger.info("在删除临时文件后检测到停止标志，终止处理")
                return
                
            
            self.work_process = 100
            total_pages = len(image_infos)
            #根据文件pdf_path的后缀判断是pdf还是image，直接返回文件类型是pdf或者image
            file_type = 'pdf' if pdf_path.lower().endswith('.pdf') else 'image'
            md_file_name = os.path.basename(output_path)
            docx_file_name = os.path.basename(docx_output_path)
            source_file_name = os.path.basename(pdf_path)
            yield ProcessInfo(progress=self.work_process, msg="处理完成", 
                            md_file=md_file_name, docx_file=docx_file_name, 
                            source_file=source_file_name, total_pages=total_pages,file_type = file_type ).dumps()
        except asyncio.CancelledError:
            logger.info("在生成文件阶段收到取消信号")
            self.stop_flag = True
            yield ProcessInfo(progress=self.work_process, msg="任务已取消", error=True).dumps()
            return 

    async def sse_execute(self) -> AsyncGenerator[str, None]:
        """
        sse方式返回处理结果
        """
        pdf_path = self.request.expand_request.get(AGENT_EXPAND_KEY.file_path)
        if not self.request or not pdf_path:
            yield self.sseOutput.answer_content_no_history(ProcessInfo(progress=self.work_process, msg="Error: No PDF file provided", error=True).dumps())
            return
            
        # 在每次调用前重置SSE输出状态，防止输出混乱
        self.sseOutput.clean()
        try:
            # 设置一个标志，使这个实例处于SSE模式
            self._in_sse_mode = True
            #生成一个uuid
            from utils.text_util import TextUtil
            md5 = TextUtil.uuid_gen()
            # 生成一个临时目录名，包含MD5和时间戳
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            tmp_dir = md5 + '_' + timestamp
            output_dir = os.path.join(TSConstants.upload_ocr_result_md_folder, tmp_dir)
            pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
            output_filename = f'{pdf_name}-{timestamp}.md'
            docx_output_filename = f'{pdf_name}-{timestamp}.docx'
            #把TSConstants.upload_ocr_result_md_folder路径下的所有文件夹删除，但是不要删除根目录的md文件
            if os.path.exists(TSConstants.upload_ocr_result_md_folder):
                for root, dirs, files in os.walk(TSConstants.upload_ocr_result_md_folder):
                    for name in dirs:
                        dir_path = os.path.join(root, name)
                        if os.path.isdir(dir_path):  # 确保是目录
                            shutil.rmtree(dir_path)  # 强制删除目录及内容
        except asyncio.CancelledError:
            logger.info("客户端发起了任务取消")
            self.stop_flag = True
        except Exception as e:
            logger.warning_ext(f'出错了: {str(e)}')
            yield self.sseOutput.answer_content_no_history(ProcessInfo(progress=self.work_process, msg=f"处理失败: {str(e)}", error=True).dumps())
        
        # 异步解析并实时推送
        try:
            async for content in self.parse_pdf(pdf_path=pdf_path, output_dir=output_dir, 
                                                output_filename=output_filename, 
                                                docx_output_filename=docx_output_filename):
                yield self.sseOutput.answer_content_no_history(content)
        except asyncio.CancelledError:
            logger.info("客户端发起了任务取消 - 在parse_pdf执行过程中")
            self.stop_flag = True
            yield self.sseOutput.answer_content_no_history(ProcessInfo(progress=self.work_process, msg="任务已取消", error=True).dumps())
        except Exception as e:
            logger.warning_ext(f'出错了: {str(e)}')
            yield self.sseOutput.answer_content_no_history(ProcessInfo(progress=self.work_process, msg=f"处理失败: {str(e)}", error=True).dumps()) 
        
    def excute(self):
        """
        同步接口
        """
        pass
    
 

    async def _parse_pdf_to_images(self, pdf_path, output_dir = './') -> AsyncGenerator[str, None]:
        """
        将PDF文件每页转换为图片，并保存到输出目录。
        不再进行区域解析，直接将整页图片保存并返回。
        @param pdf_path: PDF文件路径
        @param output_dir: 输出目录
        @return: 图片信息列表(图片路径, 空列表)
        """
        # 打开PDF文件
        try:
            pdf_document = fitz.open(pdf_path)
            image_infos = []
            #获取pdf_path的文件后缀名
            file_ext = os.path.splitext(pdf_path)[1].lower()
            if file_ext in ('.jpg', '.jpeg', '.png'):
                image_infos = [(pdf_path, [os.path.basename(pdf_path)])]
                yield image_infos
                return
            #获取总页数
            total_pages = len(pdf_document)
            # 遍历每一页，保存为图片并返回图片路径和空的rect_images列表，因为不再解析区域
            page_index = 0
            for page in pdf_document:
                # 每次循环开始检查停止标志
                if self.stop_flag:
                    logger.info("检测到停止标志，终止PDF解析")
                    break
                    
                logging.info(f'parse page: {page_index}')
                
                # 先yield进度信息 - 这里使用await asyncio.sleep(0)确保事件循环有机会处理这个yield
                try:
                    yield_info = ProcessInfo(progress=self.work_process, msg=f'开始解析第{page_index + 1}页/{total_pages}...').dumps()
                    yield yield_info
                    # 确保异步事件循环有机会处理
                    await asyncio.sleep(0)
                except asyncio.CancelledError:
                    logger.info(f"在处理第{page_index + 1}页时收到取消信号")
                    self.stop_flag = True
                    break

                # 如果在等待期间收到了取消信号
                if self.stop_flag:
                    logger.info(f"在处理第{page_index + 1}页图像前检测到停止标志")
                    break

                try:
                    # 直接获取整页的图片，使用更高分辨率以确保清晰度
                    page_image_pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                    page_index += 1
                    page_image = os.path.join(output_dir, f'{page_index}.png')
                    page_image_pix.save(page_image)
                    # 返回图片路径和空的rect_images列表（因为不再解析区域）
                    image_infos.append((page_image, []))
                except Exception as e:
                    logger.warning_ext(f"处理第{page_index + 1}页图像时出错: {str(e)}")
                    continue
                
                # 再次检查停止标志
                if self.stop_flag:
                    logger.info(f"在处理第{page_index}页图像后检测到停止标志")
                    break
                
                # yield完成信息 - 同样确保事件循环有机会处理
                try:
                    yield_info = ProcessInfo(progress=self.work_process, msg=f'完成解析第{page_index}页/{total_pages}...').dumps()
                    yield yield_info
                    # 确保异步事件循环有机会处理
                    await asyncio.sleep(0)
                except asyncio.CancelledError:
                    logger.info(f"在完成第{page_index}页时收到取消信号")
                    self.stop_flag = True
                    break
            
            # 安全关闭PDF文档
            if pdf_document:
                pdf_document.close()
                
            # 如果已经收到停止信号，提前返回
            if self.stop_flag:
                return
                
            # 确保返回image_infos而不是None
            if not image_infos:
                logger.warn("未生成任何图片")
                try:
                    yield "未生成任何图片"
                    # 确保异步事件循环有机会处理
                    await asyncio.sleep(0)
                except asyncio.CancelledError:
                    logger.info("在返回空图片信息时收到取消信号")
                    self.stop_flag = True
                return
                
            # 最后一次yield返回结果
            try:
                yield image_infos
            except asyncio.CancelledError:
                logger.info("在返回最终图片信息列表时收到取消信号")
                self.stop_flag = True
        except asyncio.CancelledError:
            logger.info("PDF图片处理过程被取消")
            self.stop_flag = True
            return
        except Exception as e:
            logger.warning_ext(f"PDF图片处理出现异常: {str(e)}")
            yield ProcessInfo(progress=self.work_process, msg=f"处理PDF图片时出错: {str(e)}", error=True).dumps()
            return
    def _build_prompt(self) -> str:
        """
        构建提示语。
        """
        request:ChatRequest = self.request
        layoutDirection:str = request.expand_request.get(AGENT_EXPAND_KEY.layoutDirection, Layout_Direction.left_to_right)
        enabaleSentence:bool = request.expand_request.get(AGENT_EXPAND_KEY.enabaleSentence, False)
        enableVertical:bool = request.expand_request.get(AGENT_EXPAND_KEY.enableVertical, False)
        enableConvert:bool = request.expand_request.get(AGENT_EXPAND_KEY.enableConvert, False )
        prompt = DEFAULT_PROMPT
        index:int  = 4
        if enableConvert:
            prompt += f"""\n{index}.注意，该图片中的文字是繁体的，转换成简体的。"""
            index += 1
        if layoutDirection == Layout_Direction.right_to_left:
            prompt += f"""\n{index}. 注意，该图片中的文字是从右到左的排版的，转换成从左到右的。"""
            index += 1
        if enabaleSentence:
            prompt += f"""\n{index}.注意，图片中的文字是文言文且无标点符号的，识别到的文字需要进行断句(添加标点符号)。"""
            index += 1
        if enableVertical:
            prompt += f"""\n{index}.注意，该图片中的文字是竖版的，转换成横板的。"""
            index += 1
        
        return prompt

        pass
    def _process_page(self, index: int, image_info: Tuple[str, List[str]]) -> Tuple[int, str]:
        """
        处理单页图片
        @param index: 页码索引
        @param image_info: 图片信息元组(图片路径, 空列表)
        @return: (页码索引, 处理后的markdown内容)
        """
        request:ChatRequest = self.request
        page_image, _ = image_info
        
        # 打开图片文件
        try:
            with open(page_image, "rb") as image_file:
                try:
                    image_data = base64.b64encode(image_file.read()).decode("utf-8")
                except UnicodeError as e:
                    logger.warning_ext(f"处理第{index+1}页图片base64编码时Unicode错误: {str(e)}")
                    return index, f"处理图片时Unicode编码错误"
                except Exception as e:
                    logger.warning_ext(f"处理第{index+1}页图片base64编码时出错: {str(e)}")
                    return index, f"处理图片时出错: {str(e)}"
        except Exception as e:
            logger.warning_ext(f"打开第{index+1}页图片文件时出错: {str(e)}")
            return index, f"打开图片文件时出错: {str(e)}"

        try:
            if self.request.platform == "openai":
                return self._process_with_openai(index, page_image, image_data)
            elif self.request.platform == "ollama":
                return self._process_with_ollama(index, page_image, image_data)
            else:
                return index, f"Unsupported platform: {self.request.platform}"
        except Exception as e:
            logger.warning_ext(f"Error processing page {index + 1} with platform {self.request.platform}: {str(e)}")
            return index, f"Error: {str(e)}"
                
    def _remove_markdown_backticks(self, content: str) -> str:
        """
        删除markdown中的```字符串。
        """
        if '```markdown' in content:
            content = content.replace('```markdown\n', '')
            last_backticks_pos = content.rfind('```')
            if last_backticks_pos != -1:
                content = content[:last_backticks_pos] + content[last_backticks_pos + 3:]
        return content
    def _process_with_openai(self, index: int, page_image: str, image_data: str) -> Tuple[int, str]:
        """
        Process image using OpenAI's API.
        """
        request: ChatRequest = self.request
        client = OpenAI(api_key=request.api_key, base_url=request.base_url)
        prompt:str = self._build_prompt()
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": DEFAULT_ROLE_PROMPT},
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_data}"}}
                ]}
            ]
        )

        if not response.choices:
            logger.warning_ext(f"Error: Empty choices in API response for page {index + 1}")
            return index, f"Error: Empty choices in API response for page {index + 1}"

        content = response.choices[0].message.content.strip()
        if not content:
            return index, f"未识别到内容"
        return index, self._remove_markdown_backticks(content)



    def _process_with_ollama(self, index: int, page_image: str, image_data: str) -> Tuple[int, str]:
        """
        Process image using Ollama's local API with the Python client.
        """
        request: ChatRequest = self.request

        try:
            client = ollama.Client(request.base_url)
            # 使用 ollama Python 客户端发送请求
            prompt:str = self._build_prompt()
            response = client.generate(
                model=request.model,
                prompt=prompt,
                images=[image_data]  # image_data 应该是 base64 编码的字符串
            )

            content = response.get("response", "").strip()
            if not content:
                return index, "未识别到内容"
            
            return index, self._remove_markdown_backticks(content)
        
        except Exception as e:
            return index, f"Ollama 调用出错: {str(e)}"