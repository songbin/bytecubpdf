from abc import ABC, abstractmethod
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.adapter.dynamic_adapter import DynamicAdapter
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.message import Message
from ai_enginee.models.message_img import MessageImg
from typing import AsyncGenerator, Union
import copy
class Agent(ABC):
    """
    Agent类是一个抽象基类，定义了智能体的基本结构和必须实现的方法。
    所有具体的智能体类都应该继承自这个类并实现其抽象方法。
    """
    request:ChatRequest = None
    name:str = '基类agent'
    description:str = '所有的agent都继承自这个agent, 这个agent是一个抽象类，不能直接使用，需要继承这个类并实现其抽象方法'
    code:str = 'agent'
    llm_client = None
    def __init__(self, request:ChatRequest):
        self.request = copy.deepcopy(request) if request else None
        self.llm_client = DynamicAdapter.create_adapter(request=request) if request else None
    def initialize(self, request: ChatRequest):
        """
        初始化智能体的请求信息。
        :param request: 包含请求信息的 ChatRequest 对象。
        """
        self.request = copy.deepcopy(request)
        self.llm_client = DynamicAdapter.create_adapter(request=request)
    @abstractmethod
    def excute(self)->LLMResponse:
        """
        同步接口
        :return: 同步结果 LLMResponse
        """
        pass

    @abstractmethod
    async def sse_execute(self)-> AsyncGenerator[str, None]:
        """
        sse方式返回
        :return: 返回一个生成器，生成智能体的决策和环境的当前状态。
        """
        pass

    def ask_llm(self, 
        is_stream:bool = False,
        prompt_system:str = '',
        prompt_user_prefix:str = '',
        is_replace:bool = False)->Union[LLMResponse, AsyncGenerator]:
        """
        向大模型提问
        @is_stream: 是否是sse模式
        @prompt_system: 系统提示词
        @prompt_user_prefix: 用户原始提问前面加的提示词
        @is_replace: 对于用户提问是直接替换还是追加
        @return: 如果是sse模式，返回一个生成器，否则返回LLMResponse对象
        """
        
        user_prefix:str = f"""
            {prompt_user_prefix}
            以下是用户输入内容：
        """
        self.replace_prompt(is_replace=is_replace,prompt_system=prompt_system, prompt_user_prefix=prompt_user_prefix)
        if is_stream:
            return self.llm_client.chat_sse(self.request.messages)
        else:
            return self.llm_client.chat(self.request.messages)



    def replace_prompt(self, is_replace:bool=False, prompt_system:str = '', prompt_user_prefix:str = ''):
        '''
        替换提示词,用户和系统提示词都替换
        '''   
        self.__replace_system_prompt(prompt_system)
        self.__replace_user_prompt(is_replace=is_replace, prompt = prompt_user_prefix)

    def __replace_system_prompt(self, prompt:str= ''):
        """
        替换系统提示词
        messages第一行不是system则直接添加到第一行
        第一行是system则替换content
        如果messages为None，则创建新的messages列表并添加system提示
        """
        if not self.request.messages:
            self.request.messages = [Message(role='system', content=prompt)]
        elif self.request.messages[0].role != 'system':
            self.request.messages.insert(0, Message(role='system', content=prompt))
        else:
            self.request.messages[0].content = prompt
    def __replace_user_prompt(self, is_replace:bool=False, prompt:str = ''):
        """
        修改用户提示词，需要把用户的提问取出来，重新组装提示词
        组装方式是，把用户的提问追加到messages最后一行的content中的后面
        """
        if self.request.messages[-1].role != 'user':
            self.request.messages.append(Message(role='user', content=prompt))
        else:
            last_message = self.request.messages[-1]
            if self.request.intent_flow and isinstance(last_message, MessageImg):
                '''这里要进行意图识别，所以请求的是文本模型，所以要把图形提问转变为文本提问'''
                text_contents = [item.text for item in last_message.content if item.type == 'text']
                new_content = prompt + '\n用户上传了一张图片并进行了以下提问:' + '\n'.join(text_contents)
                self.request.messages[-1] = Message(role='user', content=new_content)
            elif isinstance(last_message, MessageImg):
                for item in last_message.content:
                    if item.type == 'text':
                        query = prompt if is_replace else f"{prompt}\n以下是用户提问:\n"
                        item.text = query
                        break
            else:
                # query = prompt if is_replace else f"{prompt}\n以下是用户提问:\n"
                # 不管is_replace是true还是false,都追加原有提问内容
                original_content = last_message.content
                query = f"{prompt}\n以下是用户提问:\n{original_content}"
                last_message.content = query