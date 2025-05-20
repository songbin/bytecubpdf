from ai_enginee.adapter.error_codes import ERROR_CODES
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.enums.error_enum import ErrorEnum
import json

class ModelResponseFormatUtil:
    '''
    把不同大模型的返回结果格式化到统一的数据结构
    1.格式化为dict
    2.格式化为LLMResponse对象
    @param chunk : 原始数据,是openai里的chunk对象
    '''
    @classmethod
    def formatOpenAiSse2Dict(cls, chunk)->dict:
        '''
        格式化为dict
        专门格式化openai类协议的sse模式下的返回值
        @param chunk: openai返回的原始数据
        '''
        delta = chunk.choices[0].delta
        model_extra = chunk.model_extra
        usage = model_extra['usage'] if model_extra else None
        content = delta.content if delta else None
        reasoning_content = delta.reasoning_content if hasattr(delta, 'reasoning_content') else None
        finish_reason = chunk.choices[0].finish_reason
        response_dict = cls._format_sse_response(usage, finish_reason, content, reasoning_content=reasoning_content)
        response_dict['data']['reasoning_content'] = reasoning_content
        return response_dict

    @classmethod
    def formatOpenAiSee2Response(cls, chunk)->LLMResponse:
        '''
        格式化为LLMResponse对象
        专门格式化openai类协议的sse模式下的返回值
        @param chunk: openai返回的原始数据
        '''
        cls.formatOpenAiSse2Dict(chunk)
        return LLMResponse.from_dict(cls.formatOpenAiSse2Dict(chunk))
        
    @classmethod
    def formatOpenAiSync2Dict(cls, response):
        '''
        格式化为dict
        @param response: openai返回的原始数据
        专门格式化openai类协议的非sse模式下的返回值
        '''  
        message = response.choices[0].message
        content:str = message.content
        finish_reason:str = response.choices[0].finish_reason
        # 新增取出reasoning_content的逻辑
        reasoning_content = getattr(message, 'reasoning_content', None)
        return {
            'data': {
                'content': content,
                'reasoning_content': reasoning_content,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                },
                'finish_reason': finish_reason,
                
            },
            'code': 200 if finish_reason in (None, 'stop') else 500,
            'msg': ERROR_CODES.get(finish_reason, '')
        }

    @classmethod
    def formatOpenAiSync2Response(cls, response)->LLMResponse:
        '''
        格式化为LLMResponse对象
        @param response: openai返回的原始数据
        专门格式化openai类协议的非sse模式下的返回值
        '''
        return LLMResponse.from_dict(cls.formatOpenAiSync2Dict(response))

    @classmethod
    def _format_sse_response(cls, usage:dict, finish_reason:str, content:str, reasoning_content:str=None)->dict:
        return {
            'data': {
                'content':  '' if reasoning_content else content,
                'reasoning_content': reasoning_content,
                'usage': {
                    'prompt_tokens': usage.get('prompt_tokens', 0) if usage else 0,
                    'completion_tokens': usage.get('completion_tokens', 0) if usage else 0,
                    'total_tokens': usage.get('total_tokens', 0) if usage else 0
                },
                'finish_reason':finish_reason
            },
            'is_reasoning':True if reasoning_content else False, #如果存在reasoning_content，说明是reasoning模式
            'code': ErrorEnum.SUCCESS.code if finish_reason in (None, 'stop') else 500,
            'msg': ERROR_CODES.get(finish_reason, '')
        }

    @classmethod
    def formatYtoAiSync2Dict(cls, response):
        """
        格式化为dict
        专门格式化YtoAI类协议的非sse模式下的返回值
        @param response: YtoAI bailianllm返回的原始数据
        """
        return {
            'data': {
                    'content':  response["data"]["contents"][0]["content"],
                    'usage': {
                        'prompt_tokens': 0,
                        'completion_tokens': 0,
                        'total_tokens': 0,
                    },
                    'is_reasoning': False,
                    'finish_reason':"stop",
                    },
            'code': 200 ,
            'msg': ''
        }

    @classmethod
    def formatYtoAiQWENVLSync2Dict(cls, response):
        """
        格式化为dict
        专门格式化YtoAI类协议的非sse模式下的返回值
        @param response: YtoAI QWENVL返回的原始数据
        """
        choices = response["data"].get("choices")
        extCol = response.get("extCol", None)  # 入参中的extCol
        if choices:
            choice = choices[0]
            finish_reason = choice.get("finishReason")
            message = choice.get("message")
            content = message[0].get("content")[0]
            text_content = content.get("text")
            return {
                'data': {
                        'content': text_content,
                        'usage': {
                            'prompt_tokens': 0,
                            'completion_tokens': 0,
                            'total_tokens': 0,
                        },
                        'finish_reason': finish_reason,
                        'extCol': extCol,
                        },
                'code': 200 if finish_reason in (None, 'null', 'stop') else 500,
                'msg': ERROR_CODES.get(finish_reason, '')
            }
    @classmethod
    def formatYtoAiSse2Dict(cls, chunk):
        """
        格式化为dict
        专门格式化YtoAI类协议的sse模式下的返回值
        @param chunk: YtoAI bailianllm返回的原始数据
        """
        # 判断 contents 字段是否存在且不为空
        if chunk.get("contents") and chunk["contents"]:
            # 处理成功响应
            index = chunk['contents'][0].get('index')  # 使用 get 方法避免 KeyError
            return {
                    'data': {
                        'content':  chunk["contents"][0]["content"],
                        'usage': {
                            'prompt_tokens': 0,
                            'completion_tokens': 0,
                            'total_tokens': 0,
                        },
                        'index': index if index is not None else 0,  # 如果 index 不存在，设置为 0
                        'is_reasoning': False,
                        'finish_reason': chunk['contents'][0]['finishReason'],
                        'reasoning_content': chunk['contents'][0]['reasoningContent'],
                        'role': chunk['contents'][0]['role']
                    },
                    'code': 200 ,
                    'msg': ''
                }

    @classmethod
    def formatYtoAiQWENVLSse2Dict(cls, chunk):
        """
        格式化为dict
        专门格式化YtoAI类协议的sse模式下的返回值
        @param chunk: YtoAI QWENVL返回的原始数据
        """
        choices = chunk.get("output", {}).get("choices")
        usage = chunk.get("usage", {})
        request_id = chunk.get("request_id", None)  # 入参中的extCol
        if choices:
            choice = choices[0]
            finish_reason = choice.get("finish_reason")
            message = choice.get("message")
            content = message[0].get("content")[0]
            text_content = content.get("text")
            # 模拟新的格式化方法
            reasoning_content = ""  # 假设 reasoning_content 数据需要从其他地方获取，这里先初始化为空字符串
            return {
                'data': {
                    'content': '' if reasoning_content else text_content,
                    'reasoning_content': reasoning_content,
                    'usage': {
                        'prompt_tokens': usage.get('image_tokens', 0),
                        'completion_tokens': usage.get('input_tokens', 0),
                        'total_tokens': usage.get('input_tokens', 0) + usage.get('output_tokens', 0)
                    },
                    'finish_reason': finish_reason,
                    'requestId': request_id,
                },
                'is_reasoning': True if reasoning_content else False,  # 如果存在reasoning_content，说明是reasoning模式
                'code': 200 if finish_reason in (None, 'null', 'stop') else 500,
                'msg': ERROR_CODES.get(finish_reason, '')
            }

    # @classmethod
    # def formatContentStr2Response(cls, content:str)->LLMResponse:
    #     '''
    #     @param content 对话输出内容
    #     '''
    #     response:LLMResponse = LLMResponse()
        
         