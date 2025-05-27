from typing import List, Union, Optional, Type, get_origin, get_args
from pydantic import BaseModel
import inspect

class ModelMarkdownGenerator:
    """Markdown文档生成器核心类，用于自动生成Pydantic模型的结构文档"""
    
    @classmethod
    def to_markdown(cls, model_class: Type[BaseModel] = None) -> str:
        """
        主入口方法：生成模型结构的Markdown文档
        Args:
            model_class: 需要生成文档的Pydantic模型类，默认为当前类
        Returns:
            格式化后的Markdown字符串
        """
        model_class = model_class or cls.__class__
        markdown_lines = [
            f"### {model_class.__name__} 数据结构",  # 主标题
            # f"**{model_class.__name__}**"            # 模型名称
        ]
        cls._generate_model_markdown(model_class, markdown_lines, 1)
        return "\n".join(markdown_lines)

    @classmethod
    def _get_type_name(cls, type_hint) -> str:
        """
        解析类型注解为可读的字符串
        Args:
            type_hint: 需要解析的类型注解
        Returns:
            类型名称字符串（支持嵌套类型）
        """
        origin = get_origin(type_hint)
        args = get_args(type_hint)

        # 处理基础类型和直接嵌套模型
        if origin is None:
            if inspect.isclass(type_hint) and issubclass(type_hint, BaseModel):
                return type_hint.__name__  # 返回模型类名
            return type_hint.__name__ if hasattr(type_hint, '__name__') else str(type_hint)
        
        # 处理 Optional 类型（Union[T, None]）
        if origin is Union:
            non_none_args = [a for a in args if a is not type(None)]
            if len(non_none_args) == 1:
                return f"Optional[{cls._get_type_name(non_none_args[0])}]"
            return " | ".join(cls._get_type_name(arg) for arg in args)
        
        # 处理 List 类型（支持嵌套）
        if origin in (list, List):
            return f"List[{cls._get_type_name(args[0])}]" if args else "List"
        
        return str(type_hint)

    @classmethod
    def _process_field_type(cls, field_type, markdown_lines, indent_level):
        """
        递归处理字段类型中的嵌套结构
        Args:
            field_type: 字段类型注解
            markdown_lines: 保存生成的Markdown内容
            indent_level: 当前缩进层级
        """
        origin = get_origin(field_type)
        args = get_args(field_type)
        
        # 解包 Optional 类型（Union[T, None]）
        if origin is Union:
            non_none_args = [a for a in args if a is not type(None)]
            if non_none_args:
                cls._process_field_type(non_none_args[0], markdown_lines, indent_level)
            return
        
        # 处理 List 类型中的嵌套模型
        if origin in (list, List):
            if args:
                item_type = args[0]
                if inspect.isclass(item_type) and issubclass(item_type, BaseModel):
                    cls._generate_model_markdown(item_type, markdown_lines, indent_level)
            return
        
        # 处理直接嵌套的模型类
        if inspect.isclass(field_type) and issubclass(field_type, BaseModel):
            cls._generate_model_markdown(field_type, markdown_lines, indent_level)

    @classmethod
    def _generate_model_markdown(cls, model_class, markdown_lines, indent_level):
        """
        递归生成模型结构的Markdown内容
        Args:
            model_class: 当前处理的模型类
            markdown_lines: 保存生成的Markdown内容
            indent_level: 当前缩进层级（控制文档结构）
        """
        indent = "    " * indent_level
        # 添加模型标题
        markdown_lines.append(f"{indent}- **{model_class.__name__}**")
        # 添加模型文档注释
        if model_class.__doc__:
            clean_doc = model_class.__doc__.strip().replace(' ', '')  # 清理文档字符串
            markdown_lines.append(f"{indent}-{clean_doc}")
        
        # 遍历模型字段
        for name, field_info in model_class.model_fields.items():
            type_name = cls._get_type_name(field_info.annotation)
            desc = field_info.description or "无描述"  # 默认描述
            
            # 添加字段信息行
            markdown_lines.append(f"{indent}    - {name}: ({type_name}) {desc}")
            
            # 递归处理嵌套类型
            cls._process_field_type(field_info.annotation, markdown_lines, indent_level + 2)

# API兼容性适配器
def to_markdown(self, model_class: Type[BaseModel] = None) -> str:
    """提供给Pydantic模型的适配方法"""
    return ModelMarkdownGenerator.to_markdown(model_class or self.__class__)

# 注册方法到Pydantic基类
BaseModel.to_markdown = to_markdown