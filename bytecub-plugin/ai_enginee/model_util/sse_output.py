from typing import AsyncGenerator, Union
import json
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.enums.intent_enum import IntentEnum
from ai_enginee.enums.error_enum import ErrorEnum
class SSEOutput:
    def __init__(self):
        # 存储SSE完整的内容
        self.complete_content = ''
    
    def thinking_chunk(self, chunk:str)->str:
        '''
        @param chunk: 大模型sse返回的已经被格式化成json字符串的chunk内容
        @return: 把非思考列的内容抽取出来
        sse返回的内容吗，全部作为思考
        目的是为了哪些中间状态的大模型调用，在我们系统都都归纳为思考，前端就不考虑展示了
        '''
        # 假设chunk是json字符串
        chunk_dict = json.loads(chunk)
        res:LLMResponse = LLMResponse.from_dict(chunk_dict)
        if not res.is_reasoning:
            res.is_reasoning = True
            res.reasoning_content = res.content
            self.complete_content += res.content
            res.content = ''
        return res.dumps()

    def thinking_content(self, content:str)->str:
        '''
        说明这个content就是思考，不会展示出来的
        @return: 把非思考列的内容抽取出来
        '''
        res:LLMResponse = LLMResponse.from_content_str(content)
        res.content = ''
        res.is_reasoning = True
        res.content = content
        res.reasoning_content = content
        self.complete_content += content
        return res.dumps()
    
    def answer_chunk(self, chunk:str)->str:
        '''
        @param chunk: 大模型sse返回的已经被格式化成json字符串的chunk内容
        @return: 把非思考列的内容抽取出来
        '''
        chunk_dict = json.loads(chunk)
        res:LLMResponse = LLMResponse.from_dict(chunk_dict)
        if not res.content:
            self.complete_content += res.content
        
        return chunk
    
    def answer_content(self, content:str, code:int = ErrorEnum.SUCCESS.code)->str:
        '''
        把thinking_chunk里提炼出来的回答，按照chunk的形式组装
        @return: 把非思考列的内容抽取出来
        '''
        self.complete_content += content
        return LLMResponse.from_content_to_json_str(content,code)
    def answer_content_no_history(self, content:str, code:int = ErrorEnum.SUCCESS.code, is_reasoning = False)->str:
        '''
        把thinking_chunk里提炼出来的回答，按照chunk的形式组装
        @return: 把非思考列的内容抽取出来
        '''
        self.complete_content = content
        return LLMResponse.from_content_to_json_str(content,code, is_reasoning)
    def clean(self):
        '''
        清理sse的内容
        '''
        self.complete_content = ''