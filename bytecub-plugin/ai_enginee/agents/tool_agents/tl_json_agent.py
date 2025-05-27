from agents.agent import Agent
from typing import AsyncGenerator, Union
from models.llm_res.llm_response import LLMResponse
from models.chat_request import ChatRequest
from enums.intent_enum import IntentEnum
class TlJsonAgent(Agent):
    """
    用于json格式校准，把文本信息转化为json格式
    """
    name = '数据格式化专家'
    description = '你是一名伟大的json格式化专家，能把文本信息格式化为指定的json格式'
    code = 'tl_common_agent'
    intent_type = IntentEnum.INTENT_TOOL.code

    def __init__(self, request:ChatRequest = None):
        super().__init__(request)

    async def sse_execute(self, 
        prompt_system:str = '',
        prompt_user_prefix:str = '',
        is_replace:bool = False)-> AsyncGenerator[str, None]:
        """
        sse方式返回
        :return: 返回一个生成器，生成智能体的决策和环境的当前状态。
        """
        async for chunk in super().ask_llm(is_stream=True, is_replace=is_replace, prompt_system=prompt_system, prompt_user_prefix=prompt_user_prefix):
            yield chunk

    def excute(self, 
        is_stream:bool = False,
        prompt_system:str = '',
        prompt_user_prefix:str = '',
        is_replace:bool = False)-> LLMResponse:
        """
        同步接口
        :return: 同步结果 LLMResponse
        """
        return super().ask_llm(is_stream=False, is_replace=is_replace, prompt_system=self.prompt_system, prompt_user_prefix=self.user_prompt)

     