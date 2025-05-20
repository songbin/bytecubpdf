from pydantic import BaseModel, field_validator, model_validator
from typing import Literal, List
from utils.chatlog import logger

class ContentItem(BaseModel):
    type: Literal['text', 'image_url', 'video_url']
    text: str = None
    image_url: dict = None
    video_url: dict = None

    @model_validator(mode='after')
    def check_type_consistency(self):
        if self.type == 'text':
            if self.text is None:
                raise ValueError("text 字段必须存在当 type 为 'text'")
            if self.image_url is not None or self.video_url is not None:
                raise ValueError("媒体字段必须为 None 当 type 为 'text'")
        else:
            if getattr(self, self.type) is None:
                raise ValueError(f"{self.type} 字段必须存在当 type 为 '{self.type}'")
            if self.text is not None:
                raise ValueError("text 必须为 None 当 type 为媒体类型")
        return self

    def to_dict(self):
        return self.model_dump(exclude_none=True)

class MessageImg(BaseModel):
    role: Literal['user', 'assistant', 'system']
    content: List[ContentItem]

    @field_validator('content')
    def validate_content(cls, v):
        if not v:
            logger.warning("消息内容不能为空")
            raise ValueError('消息内容不能为空')
        
        has_media = any(item.type in ('image_url', 'video_url') for item in v)
        has_text = any(item.type == 'text' for item in v)
        
        if has_media and not has_text:
            logger.warning("媒体类型内容必须包含文本描述")
            raise ValueError("媒体内容需要配合文本说明")
            
        return v

    def to_dict(self):
        data = {
            "role": self.role,
            "content": [item.to_dict() for item in self.content]
        }
        return data