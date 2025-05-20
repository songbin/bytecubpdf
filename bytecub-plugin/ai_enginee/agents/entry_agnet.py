from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.models.message_img import MessageImg
from ai_enginee.models.message import Message
from ai_enginee.agents.plan_agent import PlanAgent
from typing import AsyncGenerator
from ai_enginee.models.llm_res.llm_response import LLMResponse
from abc import ABC, abstractmethod
from ai_enginee.agents.agent import Agent
from ai_enginee.enums.error_enum import ErrorEnum
from utils.chatlog import logger
class EntryAgent:
    '''
    入口代理类，用于处理聊天请求。
    1.controller层只调用这个agent
    2.调用多个agent，中间调度期间，需要和前端通讯，输出当前状态的yield
    3.进行格式校验等，下一步调用规划agent(系统目前只做一个planAgent)
    4.封装底层返回的yield为dataresult类型，个前端yield回去
    '''
    def __init__(self, request: ChatRequest, is_stream: bool = False):
        self.request:ChatRequest = request
        self.stream: bool = is_stream
        self.planAgent: PlanAgent = PlanAgent(request, is_stream)


    async def sse_execute(self) -> AsyncGenerator[str, None]:
        """
        异步执行接口
        """
        try:
            async for chunk in self.planAgent.sse_execute():
                yield chunk
        except Exception as e:
            logger.warning_ext(f'出错了: {str(e)}')
            error_response = LLMResponse.from_content_to_json_str(f'出错了: {str(e)}', ErrorEnum.SERVER_ERROR.code)
            yield error_response

    def execute(self) -> LLMResponse:
        """
        同步执行接口
        """
        try:
            return self.planAgent.execute()
        except Exception as e:
            logger.warning_ext(f'出错了: {str(e)}')
            error_response = LLMResponse.from_content_str(f'出错了: {str(e)}',ErrorEnum.SERVER_ERROR.code)
            return error_response

        
