from pydantic import BaseModel, validator
from typing import List
from .message_img import MessageImg
import os

class ChatImgRequest(BaseModel):
    messages: List[MessageImg]
    platform: str = os.getenv('LLM_PLATFORM', 'silicon')
    api_key: str = os.getenv('LLM_API_KEY', '')
    model: str = os.getenv('LLM_MODEL', 'gpt-4')
    img_model: str = os.getenv('LLM_IMG_MODEL', 'gpt-4-vision-preview')
    temperature: float = 0.7
    max_tokens: int = 4000
    img_url: str = ''
    check_image: bool = False

    @validator('messages')
    def validate_messages(cls, v):
        if not v:
            raise ValueError('消息列表不能为空')
        # 验证逻辑已由Message模型保证
        return v