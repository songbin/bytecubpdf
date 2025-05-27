from typing import Type, Any, Union, List, Dict, get_origin, get_args
from pydantic import BaseModel, Field
from pydantic.fields import FieldInfo
import inspect
import json
import re
from ai_enginee.utils.chatlog import logger

class ModelExampleGenerator:
    """示例数据生成器核心类，处理Pydantic模型的动态示例生成"""
    
    @classmethod
    def model_example_data_generator(cls, model_class: Type[BaseModel] = None,is_comment:bool=False) -> str:
        """
        主入口方法：生成并格式化示例数据
        Args:
            model_class: 需要生成示例的Pydantic模型类，默认为当前类
        Returns:
            格式化后的JSON字符串
        """
        model_class = model_class or cls.__class__
        result = cls._generate_example(model_class)
        json_str =  json.dumps(result, ensure_ascii=False, indent=4)
        if is_comment:
            pattern = re.compile(r'(?<=})\s*(?=])')
            json_str = pattern.sub('\n //更多信息 \n', json_str)
        return json_str

    @classmethod
    def _process_field(cls, field: FieldInfo) -> Any:
        """
        处理单个字段的示例生成（核心逻辑）
        Args:
            field: Pydantic字段信息对象
        Returns:
            字段的示例值
        """
        # 获取字段的示例值和默认值
        example = field.examples if hasattr(field, 'examples') else None
        default = field.default if hasattr(field, 'default') else None
        field_type = field.annotation
        # 如果存在示例值，则直接返回
        if example:
            return example[0] if isinstance(example, list) else example
        # 处理嵌套模型（递归入口）
        if inspect.isclass(field_type) and issubclass(field_type, BaseModel):
            return cls._generate_example(field_type)
        
        # 处理泛型类型（List/Dict/Union等）
        origin = get_origin(field_type)
        if origin:
            type_args = get_args(field_type)
            
            # List类型处理（支持嵌套模型列表）
            if origin is list:
                item_type = type_args[0]
                if inspect.isclass(item_type) and issubclass(item_type, BaseModel):
                    # 收集子模型所有字段的examples数量
                    example_counts = []
                    for field in item_type.model_fields.values():
                        examples = getattr(field, 'examples', [])
                        if isinstance(examples, list) and len(examples) > 0:
                            example_counts.append(len(examples))
                    # 确定生成的实例数量
                    max_count = max(example_counts) if example_counts else 1
                    examples_list = []
                    for i in range(max_count):
                        example_data = {}
                        for name, field in item_type.model_fields.items():
                            field_examples = getattr(field, 'examples', [])
                            # 优先使用当前索引的example值
                            if isinstance(field_examples, list) and i < len(field_examples):
                                example_value = field_examples[i]
                            else:
                                # 递归处理字段以生成默认值或嵌套结构
                                example_value = cls._process_field(field)
                            example_data[name] = example_value
                        examples_list.append(example_data)
                    return examples_list
                else:
                    return example if example else [default or cls._generate_default(item_type)]
            
            # Dict类型处理（生成示例键值对）
            if origin is dict:
                key_type, value_type = type_args
                return {
                    cls._generate_default(key_type): cls._generate_default(value_type)
                }
            
            # Union/Optional类型处理（主要处理Optional嵌套）
            if origin is Union:
                non_none_args = [a for a in type_args if a is not type(None)]
                if len(non_none_args) == 1:
                    item_origin = get_origin(non_none_args[0])
                    item_args = get_args(non_none_args[0])
                    
                    # 处理Optional[List[BaseModel]]的情况
                    if item_origin is list:
                        item_type = item_args[0]
                        # 完全复用List类型的处理逻辑
                        if inspect.isclass(item_type) and issubclass(item_type, BaseModel):
                            # 此处直接调用已实现的列表处理逻辑
                            return cls._process_field(
                                FieldInfo(annotation=List[item_type],  # 构造等效List类型
                                        examples=field.examples if hasattr(field, 'examples') else None)
                            )
                    # 处理普通Optional[BaseModel]
                    elif inspect.isclass(non_none_args[0]) and issubclass(non_none_args[0], BaseModel):
                        return cls._generate_example(non_none_args[0])
        
        # 默认值生成优先级：示例值 > 默认值 > 类型默认值
        if example:
            return example[0] if isinstance(example, list) else example
        return default or cls._generate_default(field_type)

    @staticmethod
    def _generate_default(field_type: Type) -> Any:
        """生成基础类型的默认值"""
        type_default_map = {
            int: 0,
            float: 0.0,
            str: "示例值",
            bool: False,
            list: [],
            dict: {}
        }
        return type_default_map.get(field_type, None)

    @classmethod
    def _generate_example(cls, model_cls: Type[BaseModel]) -> Union[Dict, List]:
        """
        递归生成完整模型示例
        Args:
            model_cls: 目标模型类
        Returns:
            包含所有字段示例值的字典
        """
        example_data = {}
        for name, field in model_cls.model_fields.items():
            try:
                value = cls._process_field(field)
                
                # 处理嵌套模型结构
                if isinstance(value, BaseModel):
                    value = cls._generate_example(value.__class__)
                elif isinstance(value, list):
                    # 处理列表中嵌套模型的情况
                    value = [
                        cls._generate_example(v.__class__) if isinstance(v, BaseModel) else v 
                        for v in value
                    ]
                
                example_data[name] = value
            except Exception as e:
                logger.error(f"字段 {name} 处理失败: {str(e)}")
                raise ValueError(f"Field {name} generation failed") from e
        return example_data

# 保持原有API兼容性的适配器
def model_example_data_generator(self, model_class: Type[BaseModel] = None,is_comment:bool=False) -> str:
    """兼容旧版调用方式的适配方法"""
    return ModelExampleGenerator.model_example_data_generator(model_class or self.__class__,is_comment)

# 将方法注册到Pydantic基类
BaseModel.model_example_data_generator = model_example_data_generator