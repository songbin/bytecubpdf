from .llm_res_usage import LLMResUsage
import json
from ai_enginee.enums.error_enum import ErrorEnum
class LLMResponse():
    '''
    把如下的统一格式转化
    {
            'data': {
                'content': content,
                'usage': {
                    'prompt_tokens': usage.get('prompt_tokens', 0),
                    'completion_tokens': usage.get('completion_tokens', 0),
                    'total_tokens': usage.get('total_tokens', 0)
                },
                'finish_reason':finish_reason
            },
            'code': 200 if finish_reason in (None, 'stop') else 500,
            'msg': ERROR_CODES.get(finish_reason, '')
        }
    '''
    def __init__(self, content:str, usage:LLMResUsage, 
        finish_reason:str, code:int, msg:str,reasoning_content:str='',
        is_reasoning:bool = False):
        self.content = content
        self.usage = usage
        self.finish_reason = finish_reason
        self.code = code
        self.msg = msg
        self.reasoning_content = reasoning_content
        self.is_reasoning = is_reasoning
    @staticmethod
    def from_content_to_json_str(content:str, code:int = ErrorEnum.SUCCESS.code, is_reasoning:bool = False)->str:
        '''
        输出的是json格式的字符串
        '''
        if is_reasoning:
            data = {
                "data": {
                    "content": "",
                    "reasoning_content": content,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0
                    },
                    "finish_reason": None
                },
                "is_reasoning": is_reasoning,
                "code": code,
                "msg": ""
            }
        else:
            data = {
                "data": {
                    "content": content,
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0
                    },
                    "finish_reason": None
                },
                "code": code,
                "is_reasoning": is_reasoning,
                "msg": ""
            }
    
        return json.dumps(data, ensure_ascii=False)

    @staticmethod
    def from_content_str(content:str, code:int = ErrorEnum.SUCCESS.code, is_reasoning:bool = False)->'LLMResponse':
        '''
        输出是LLMResponse的对象
         @param content 对话输出内容
        '''
        data:str = LLMResponse.from_content_to_json_str(content,code,is_reasoning=is_reasoning)
        return LLMResponse.from_json_str(data)
    @staticmethod
    def from_json_str(json_str:str):
        '''把json字符串格式的转化为对象'''
        data:dict = json.loads(json_str)
        return LLMResponse.from_dict(data)

    def to_dict(self):
        return {
            'data': {
                'content': self.content,
                'reasoning_content': self.reasoning_content,
                'usage': {
                    'prompt_tokens': self.usage.prompt_tokens,
                    'completion_tokens': self.usage.completion_tokens,
                    'total_tokens': self.usage.total_tokens
                },
                'finish_reason':self.finish_reason
            },
            'is_reasoning': self.is_reasoning,
            'code': self.code,
            'msg': self.msg
        }

    def dumps(self):
        return json.dumps(self.to_dict(), ensure_ascii=False)

    @staticmethod
    def from_dict( data):
        reasoning_content = data['data'].get('reasoning_content', '')
        is_reasoning = bool(reasoning_content)
        # 将usage字典转换为LLMResUsage对象
        usage_data = data['data']['usage']
        usage = LLMResUsage(
            prompt_tokens=usage_data['prompt_tokens'],
            completion_tokens=usage_data['completion_tokens'],
            total_tokens=usage_data['total_tokens']
        )
        return LLMResponse(
            content=data['data']['content'],
            reasoning_content=reasoning_content,
            usage=usage,  # 这里现在传入的是LLMResUsage对象
            finish_reason=data['data']['finish_reason'],
            code=data['code'],
            msg=data['msg'],
            is_reasoning=is_reasoning
        )