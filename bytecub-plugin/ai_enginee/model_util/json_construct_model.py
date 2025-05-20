import json
import re
from typing import List, Type, Union, Optional, Dict, Tuple, Any, get_origin, get_args
from pydantic import BaseModel, ValidationError
from utils.chatlog import logger
from ai_enginee.model_util.json_preprocess_util import JsonPreprocessUtil
from ai_enginee.enums.error_enum import ErrorEnum
import types

# 兼容不同Python版本的Union类型处理
UnionType = types.UnionType if hasattr(types, 'UnionType') else Union

def json_construct_model(
    model_class: Type[BaseModel], 
    json_str: str
) -> Tuple[int, Optional[BaseModel], Optional[str], Optional[Dict]]:
    """
    增强版JSON验证和模型构造器（支持多层嵌套校验）
    
    参数:
        model_class: 目标Pydantic模型类
        json_str: 待验证的原始JSON字符串（可能包含非标准格式）
        
    返回:
        Tuple[int, Optional[BaseModel], Optional[str], Optional[Dict]]:
        - 状态码（参考ErrorEnum）
        - 构造成功的模型实例
        - 模型的标准JSON字符串
        - 错误信息字典（包含字段级错误详情）
    """
    try:
        # 预处理JSON字符串（清理注释、修复常见格式错误）
        json_util = JsonPreprocessUtil()
        json_str = json_util.preprocess(json_str)
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        return ErrorEnum.JSON_PARSE_ERROR.code, None, None, {"error": f"JSON解析失败: {str(e)}"}

    errors = {}
    constructed_data = {}
    model_fields = model_class.__fields__

    # 遍历模型所有字段进行验证
    for field_name, field_info in model_fields.items():
        raw_value = data.get(field_name)
        
        try:
            # 递归验证字段值（支持嵌套类型）
            validated_value = _validate_nested_field(field_info.annotation, raw_value)
            constructed_data[field_name] = validated_value
            
            # 检查必填字段的空值情况
            if validated_value is None and field_info.is_required():
                errors[field_name] = "必填字段验证失败"
                
        except ValidationError as e:
            errors[field_name] = _extract_error_message(e)
            constructed_data[field_name] = None
        except Exception as e:
            errors[field_name] = f"字段验证失败: {str(e)}"
            constructed_data[field_name] = None
    # 如果存在验证错误则立即返回
    if errors:
        return (ErrorEnum.FIELD_VALIDATION_ERROR.code,None, None, errors)
    # 最终模型验证
    try:
        instance = model_class.model_validate(constructed_data)
        model_json = instance.model_dump_json()
    except ValidationError as e:
        return ErrorEnum.MODEL_VALIDATION_ERROR.code, None, None, {"error": f"最终模型验证失败: {str(e)}"}
    
    return (ErrorEnum.SUCCESS.code , instance, model_json, None )

def get_default_value(field_info) -> Any:
    """智能获取字段默认值（支持嵌套模型和泛型类型）"""
    # 优先使用字段定义的默认值
    if field_info.default is not None:
        return field_info.default
    if field_info.default_factory is not None:
        return field_info.default_factory()
    
    # 解析字段类型
    field_type = field_info.annotation
    type_origin = get_origin(field_type) or field_type
    
    # 基础类型默认值映射
    type_map = {
        str: "",
        int: 0,
        float: 0.0,
        bool: False,
        list: [],
        dict: {}
    }
    if type_origin in type_map:
        return type_map[type_origin]
    
    # 处理嵌套模型
    if isinstance(type_origin, type) and issubclass(type_origin, BaseModel):
        return _create_default_nested_model(type_origin)
    
    # 处理Optional类型
    if type_origin is Union and type(None) in get_args(field_type):
        return None
    
    return None

def _create_default_nested_model(model_class: Type[BaseModel]) -> Optional[BaseModel]:
    """递归创建嵌套模型默认实例"""
    nested_data = {}
    for name, field in model_class.__fields__.items():
        nested_data[name] = get_default_value(field)
    try:
        return model_class(**nested_data)
    except ValidationError:
        return None

def _extract_error_message(e: ValidationError) -> str:
    """从ValidationError提取易读的错误信息"""
    errors = e.errors()
    if not errors:
        return "未知验证错误"
    
    # 生成嵌套路径（如：user.address.street）
    error_loc = ".".join(map(str, errors[0]["loc"]))
    return f"{error_loc}: {errors[0]['msg']} (类型错误: {errors[0]['type']})"

def _validate_nested_field(field_type: Any, value: Any) -> Any:
    """
    增强版嵌套字段验证器
    功能：
    1. 处理泛型容器（List, Union）
    2. 自动转换字符串伪数组（"a,b,c" → ["a","b","c"]）
    3. 递归验证嵌套模型
    4. 处理Optional类型
    """
    origin_type = get_origin(field_type) or field_type
    type_args = get_args(field_type)
    
    # 处理列表类型
    if origin_type is list:
        # 处理字符串伪数组
        if not isinstance(value, list):
            if isinstance(value, str):
                # 仅当列表元素为字符串时自动分割
                return [x.strip() for x in value.split(',') if x.strip()]
            else:
                return [value]
        # 递归验证列表元素
        return [_validate_nested_field(type_args[0], item) for item in value]
    
    # 处理Union类型（含Python 3.10+的|语法）
    if origin_type is UnionType or origin_type is Union:
        # 尝试所有可能的类型分支
        for arg_type in type_args:
            try:
                return _validate_nested_field(arg_type, value)
            except ValidationError:
                continue
        raise ValidationError("所有Union类型均验证失败")
    
    # 处理Optional类型（Union[Type, None]的特殊情况）
    if origin_type is Union and len(type_args) == 2 and type(None) in type_args:
        if value is None:
            return None
        actual_type = type_args[0] if type_args[1] is type(None) else type_args[1]
        return _validate_nested_field(actual_type, value)
    
    # 处理嵌套模型
    if isinstance(origin_type, type) and issubclass(origin_type, BaseModel):
        if not isinstance(value, dict):
            raise ValidationError(f"期望字典类型，实际得到{type(value)}")
        
        # 递归调用构造器验证嵌套模型
        code, instance, _, errors = json_construct_model(origin_type, json.dumps(value))
        if code != ErrorEnum.SUCCESS.code:
            raise ValidationError(f"嵌套模型验证失败: {errors}")
        return instance
    
    # 基础类型验证
    try:
        return origin_type(value)
    except (TypeError, ValueError) as e:
        raise ValidationError(f"类型转换失败: {str(e)}")