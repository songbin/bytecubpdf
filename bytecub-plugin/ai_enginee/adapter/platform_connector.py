import json
from logging import log
import httpx
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from . import error_codes
from utils.chatlog import logger
from ai_enginee.model_util.model_response_format_util import ModelResponseFormatUtil
from typing import List, Union
from typing import Any, Dict, Optional
from ai_enginee.models.message_img import MessageImg
from ai_enginee.models.message import Message
from ai_enginee.models.llm_res.llm_response import LLMResponse
import requests
import uuid
import asyncio

class PlatformConnector(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass
    @abstractmethod
    def chat(self, messages: list) -> str:
        pass
    @abstractmethod
    async def chat_sse(self, messages: list) -> AsyncGenerator[str, None]:
        pass

class OpenAIAdapter(PlatformConnector):
    def __init__(self, api_key: str, model: str, temperature: float, max_tokens: int, base_url: str = None):
        from openai import OpenAI, OpenAIError
        # self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.sync_client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.stop_flag = False


    def _to_openai_messages(self, msg: Union[Message, MessageImg, dict]) -> dict:
        """将自定义消息类型转换为OpenAI兼容格式"""
        if isinstance(msg, MessageImg):
            content_items = []
            for item in msg.content:
                if item.type == 'text' and item.text:
                    content_items.append({"type": "text", "text": item.text})
                elif item.type == 'image_url' and item.image_url:
                    content_items.append({"type": "image_url", "image_url": item.image_url})
                # 暂不处理video_url，因OpenAI API暂不支持
            return {
                "role": msg.role,
                "content": content_items
            }
        elif isinstance(msg, Message):
            return msg.to_dict()
        return msg  # 兼容原生字典类型# 兼容原生字典类型

    def generate(self, prompt: str) -> str:
        try:
            response = self.sync_client.completions.create(
                model=self.model,
                prompt=prompt,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            return response.choices[0].text
        except Exception as e:
            from . import error_codes
            raise RuntimeError(f"OpenAI生成失败[{error_codes.ERROR_CODES['api_error']}]: {str(e)}")

    def chat(self, messages: List[Union[Message, MessageImg]]) -> dict:
        try:   
            dict_messages = [self._to_openai_messages(msg) for msg in messages]
            response = self.sync_client.chat.completions.create(
                model=self.model,
                messages=dict_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=False
            )
            return ModelResponseFormatUtil.formatOpenAiSync2Dict(response)
        except Exception as e:
            logger.warning_ext(f"OpenAI聊天失败")
            from . import error_codes
            raise RuntimeError(f"OpenAI聊天失败[{error_codes.ERROR_CODES['stream_error']}]: {str(e)}")



    async def chat_sse(self, messages: List[Union[Message, MessageImg]]) -> AsyncGenerator[str, None]:
        try:
            complete_content = ''
            dict_messages = [self._to_openai_messages(msg) for msg in messages]
            stream = self.sync_client.chat.completions.create(
                model=self.model,
                messages=dict_messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                stream=True
            )
            for chunk in stream:
                if self.stop_flag:  # 检查是否需要停止
                   logger.warning("流式响应已停止")
                   break

                if chunk.choices:
                    delta = chunk.choices[0].delta
                    data:Dict = ModelResponseFormatUtil.formatOpenAiSse2Dict(chunk)   
                    if data['data']['reasoning_content']:
                        data_res = ModelResponseFormatUtil.formatOpenAiSse2Dict(chunk)
                        yield f"{json.dumps(data_res, ensure_ascii=False)}"
                        # 将complete_content添加到data中              
                    if delta.content:
                        complete_content += delta.content
                        # 使用 SSE 格式返回数据
                        yield f"{json.dumps(data, ensure_ascii=False)}"                        
                    if chunk.choices[0].finish_reason:
                        # 最后一个事件需要包含完成状态
                        yield f"{json.dumps(data, ensure_ascii=False)}"
                        break

                await asyncio.sleep(0)

        except asyncio.CancelledError:
            # 捕获任务取消异常
            logger.warning("任务被取消，正在清理资源...")
            # 执行清理逻辑（如关闭流、标记任务停止等）
            self.stop_flag = True
            raise  # 重新抛出 CancelledError，通知调用方任务已取消             
        except Exception as e:
            logger.warning_ext(f"失败了")
            error_data = {
                'code': 500,
                'error': error_codes.ERROR_CODES['stream_error'],
                'message': str(e)
            }
            yield f"{json.dumps(error_data, ensure_ascii=False)}"

  
 