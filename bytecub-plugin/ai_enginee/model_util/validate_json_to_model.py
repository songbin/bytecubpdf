from typing import Type, Dict, Any, List, Union,Optional
import json
from pydantic import BaseModel, ValidationError
from utils.chatlog import logging
from ai_enginee.model_util.json_preprocess_util import JsonPreprocessUtil


def validate_json_to_model(model_class: Type[BaseModel], json_str: str) -> tuple[bool, Optional[BaseModel], Optional[str]]:
    """
    校验 JSON 字符串是否能成功转换为指定模型，且转换后的模型数据与原始 JSON 完全一致
    
    参数:
        model_class: 继承自 pydantic.BaseModel 的模型类
        json_str: 待校验的 JSON 字符串
        
    返回:
        tuple[bool, Optional[BaseModel], Optional[str]]: 
            - 是否通过校验 (bool)
            - 赋值后的模型实例 (BaseModel)，如果校验失败则为 None
            - 错误信息 (str)，如果校验成功则为 None
    """
    # 预处理 JSON 字符串（可选）
    json_util = JsonPreprocessUtil()
    json_str = json_util.preprocess(json_str)
    try:
        # 步骤1：将 JSON 字符串解析为 Python 字典
        original_data = json.loads(json_str)
        
        # 步骤2：将 JSON 转换为模型实例
        model_instance = model_class.model_validate_json(json_str)
        
        # 步骤3：将模型实例转回字典（包含所有字段，包括默认值）
        model_dict = model_instance.model_dump(mode='json')
        
        # 步骤4：深度比较原始字典与模型字典
        is_valid, compare_error = _deep_compare(original_data, model_dict)
        error_msg = compare_error if not is_valid else None

        # 返回校验结果、模型实例和错误信息
        return is_valid, model_instance if is_valid else None, error_msg
        
    except json.JSONDecodeError as e:
        error_msg = f"JSON 解析失败: {str(e)}"
        logging.error(error_msg)
        return False, None, error_msg
    except ValidationError as e:
        error_msg = f"模型校验失败: {str(e)}"
        logging.error(error_msg)
        return False, None, error_msg
    except TypeError as e:
        error_msg = f"类型错误: {str(e)}"
        logging.error(error_msg)
        return False, None, error_msg

def _deep_compare(a: Union[Dict, List, float, str, int], b: Union[Dict, List, float, str, int]) -> tuple[bool, Optional[str]]:
    """
    递归深度比较两个数据结构（支持 dict/list 等嵌套结构）
    
    特殊处理：
    - 浮点数容差（1e-9）
    - 忽略字典键顺序
    - 严格校验列表顺序
    
    返回:
        tuple[bool, Optional[str]]: 
            - 是否一致 (bool)
            - 错误信息 (str)，如果一致则为 None
    """
    # 类型基础校验
    if type(a) != type(b):
        error_msg = f"类型不一致: {type(a)} != {type(b)}"
        logging.error(error_msg)
        return False, error_msg
    
    # 处理字典类型
    if isinstance(a, dict):
        # 检查键集合是否一致
        if a.keys() != b.keys():
            error_msg = f"字典键不一致: {a.keys()} != {b.keys()}"
            logging.error(error_msg)
            return False, error_msg
        # 递归比较每个键值
        for key in a:
            is_equal, error = _deep_compare(a[key], b[key])
            if not is_equal:
                return False, f"键 '{key}' 的值不一致: {error}"
        return True, None
    
    # # 处理列表类型
    # if isinstance(a, list):
    #     # 检查长度是否一致
    #     if len(a) != len(b):
    #         return False
    #     # 按顺序递归比较每个元素
    #     return all(_deep_compare(x, y) for x, y in zip(a, b))
    
    # 处理浮点数容差
    if isinstance(a, float) and isinstance(b, float):
        flag = abs(a - b) < 1e-9
        if not flag:
            error_msg = f"浮点数不一致: {a} != {b}"
            logging.error(error_msg)
            return False, error_msg
        return flag, None
    
    # 其他类型直接比较
    flag = a == b
    if not flag:
        error_msg = f"值不一致: {a} != {b}"
        logging.error(error_msg)
        return False, error_msg
    return flag, None
