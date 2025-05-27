from pydantic import BaseModel, validator
from typing import Literal
from utils.chatlog import logger

class Message(BaseModel):
    role: Literal['user', 'assistant', 'system']
    content: str

    @validator('content')
    def validate_content(cls, v):
        if not v:
            logger.warning(f"消息内容不能为空")
            raise ValueError('消息内容不能为空')
        return v

    @validator('role')
    def validate_role(cls, v):
        if not v:
            raise ValueError('角色不能为空')
        return v

    def to_dict(self):
        """
        将Message对象转换为字典。

        返回:
            dict: 包含Message对象属性的字典。
        """
        return {
            "role": self.role,
            "content": self.content
        }
