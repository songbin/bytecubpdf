from pydantic import BaseModel, validator
from typing import List, Union
from typing import Any, Dict, Optional
from .message import Message
from .message_img import MessageImg
import os

class ChatRequest(BaseModel):
    messages: List[Union[Message, MessageImg]] = []
    platform: str = ''
    api_key: str = ''
    model: str = ''
    img_model: str = ''
    temperature: float = 0.7
    max_tokens: int = 4000
    img_url: Optional[str] = None
    check_image: Optional[bool] = False
    base_url: str = ''
    tools: Optional[dict] = None
    intent_flow: Optional[bool] = False
 
    threads: int = 4
    #扩展参数，可以传扩展的参数
    expand_request: Optional[Dict[str, Any]] = None
    @classmethod
    def from_dict(cls, data: dict) -> "ChatRequest":
        messages = []
        for msg_data in data.get('messages', []):
            if 'img_url' in msg_data:
                messages.append(MessageImg(**msg_data))
            else:
                messages.append(Message(**msg_data))
                
        return cls(
            messages=messages,
            platform=data.get('platform', ''),
            api_key=data.get('api_key', ''),
            model=data.get('model', ''),
            img_model=data.get('img_model', ''),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('max_tokens', 4000),
            img_url=data.get('img_url', ''),
            check_image=data.get('check_image', False),
            base_url=data.get('base_url', ''),
            tools=data.get('tools', {}),
            intent_flow=data.get('intent_flow', False),
            expert_plan_code=data.get('expert_plan_code', ''),
            expand_request=data.get('expand_request' , {})
        )
    