import os
import re
from typing import AsyncGenerator
from ai_enginee.adapter.platform_connector import OpenAIAdapter
from ai_enginee.models.llm_res.llm_response import LLMResponse
from ai_enginee.models.chat_request import ChatRequest
from ai_enginee.model_util.model_response_format_util import ModelResponseFormatUtil

class DynamicAdapter:
    def __init__(self, platform: str, api_key: str, model: str, temperature: float, max_tokens: int, base_url:str = ''):
        self.platform = platform
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        #yto专用参数，别的平台不需要
        self.base_url = base_url
        self.adapter = self._create_adapter()
    @staticmethod
    def create_adapter(request: ChatRequest):
       return DynamicAdapter(
                platform= request.platform,
                api_key= request.api_key,
                model=request.model,
                temperature= request.temperature,
                max_tokens= request.max_tokens,
                base_url= request.base_url
            )
        

    def _create_adapter(self):
        match self.platform:
            case 'openai':
                return OpenAIAdapter(api_key=self.api_key, model=self.model, 
                temperature=self.temperature, max_tokens=self.max_tokens,
                base_url=self.base_url)
            case 'ollama':
                return OpenAIAdapter(api_key=self.api_key, model=self.model, 
                temperature=self.temperature, max_tokens=self.max_tokens,
                base_url=self.base_url)
            
            case _:
                from . import error_codes
                raise ValueError(f'Unsupported platform: {self.platform} - {error_codes.ERROR_CODES["unsupported_platform"]}')

    def generate(self, prompt: str) -> str:
        return self.adapter.generate(prompt)

    def chat(self, messages: list) -> LLMResponse:
        response =  self.adapter.chat(messages)
        return LLMResponse.from_dict(response)

    def chat_sse(self, messages: list) -> AsyncGenerator[str, None]:
        return self.adapter.chat_sse(messages)