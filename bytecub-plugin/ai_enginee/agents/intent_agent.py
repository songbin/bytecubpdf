from abc import ABC, abstractmethod
from ai_enginee.agents.agent import Agent
from typing import AsyncGenerator, Union
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.enums.intent_enum import IntentEnum
from ai_enginee.adapter.dynamic_adapter import DynamicAdapter
import copy
class IntentAgent(Agent):
    code = 'intent_agent'
    name = '意图识别专家'
    description = '意图识别专家，用于识别用户的意图'
    prompt_system = None
    prompt_user_prefix = None
    def __init__(self, request:ChatRequest):
        super().__init__(request)
        self.intent_type = intent_type
        self.request.intent_flow = True
        self.llm_client = DynamicAdapter.create_adapter(request=request)
        
    def __init__(self):
        """
        无参构造函数，初始化意图类型为None
        """
        self.request = None
        self.intent_type = None
    def initialize(self, request: ChatRequest, prompt_system:str, prompt_user_prefix:str, intent_type:str = None):
        """
        初始化方法，接收ChatRequest对象和意图类型
        :param request: ChatRequest对象，包含聊天请求信息
        :param intent_type: 意图类型
        """
        self.request = copy.deepcopy(request)
        self.intent_type = intent_type
        self.request.intent_flow = True
        self.llm_client = DynamicAdapter.create_adapter(request=self.request)
        self.prompt_user_prefix = prompt_user_prefix
        self.prompt_system = prompt_system
        
    async def sse_execute(self)-> AsyncGenerator[str, None]:
        """
        sse方式返回
        :return: 返回一个生成器，生成智能体的决策和环境的当前状态。
        """
        async for chunk in self.__intent_planning(is_stream=True, intent_type=self.intent_type):
            yield chunk

    def excute(self)-> LLMResponse:
        """
        同步接口
        :return: 同步结果 LLMResponse
        """
        return self.__intent_planning(is_stream=False)

    def __intent_planning(self, is_stream:bool = False, intent_type:str = None)->Union[LLMResponse, AsyncGenerator]:
        """
        识别出来应该是哪个规划agent执行任务
        """

        super().replace_prompt(prompt_system=self.prompt_system, prompt_user_prefix=self.prompt_user_prefix)
        if is_stream:
            return self.llm_client.chat_sse(self.request.messages)
        else:
            return self.llm_client.chat(self.request.messages)

    