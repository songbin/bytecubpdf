
from pydantic import BaseModel as PydanticBase
from ai_enginee.model_util.model_markdown_generator import to_markdown
from ai_enginee.model_util.model_example_data_generator import model_example_data_generator
from abc import abstractmethod

class BasePromptModel(PydanticBase):
    """所有模型的基类"""
    to_markdown = to_markdown
    model_example_data_generator = model_example_data_generator
    
    @abstractmethod
    def to_dict(self):
        """将模型实例转换为字典形式"""
        pass

    @abstractmethod
    def get_user_prompt(self,user_input: str=None)->str:
       """将模型实例转换为JSON字符串形式"""
       pass

    @abstractmethod
    def get_system_prompt(self)->str:
        """将模型实例转换为JSON字符串形式"""
        pass