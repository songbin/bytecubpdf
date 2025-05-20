from ai_enginee.agents.agent import Agent
from typing import AsyncGenerator, Union
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.enums.intent_enum import IntentEnum
class TlCommonAgent(Agent):
    """
    通用类专家，非特殊业务都用这个agent，直接替换系统提示词和用户提问即可
    一般业务:向大模型提问,提问后返回的结果直接使用
    特殊业务:调用外部api、操作数据库，对大模型返回数据二次加工(例如json格式校准)等
    """
    name = '通用执行家'
    description = '通用类专家，用于处理用户的通用类任务'
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
        return super().ask_llm(is_stream=False, is_replace=is_replace, prompt_system=prompt_system, prompt_user_prefix=prompt_user_prefix)

     