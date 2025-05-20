from enum import Enum
#扩展参数枚举
class ExtendEnum(Enum):
    """
    指定工作流编码
    """
    EXPERT_PLAN_CODE=('expert_plan_code', "指定工作流编码")

    def __new__(cls, *args):
        obj = object.__new__(cls)
        obj._value_ = args  # 设置枚举的_value_属性
        if len(args) == 2:  # 如果有两个参数，分别赋值给code和msg
            obj.code, obj.msg = args
        return obj

    @classmethod
    def from_code(cls, code):
        """通过code获取枚举成员（遍历实现）"""
        for member in cls:
            if member.code == code:
                return member
        raise ValueError(f"未找到code={code}对应的枚举成员")

    # 优化版查找（字典缓存）
    _code_map = None  # 类级缓存字典

    @classmethod
    def _initialize_code_map(cls):
        if cls._code_map is None:
            cls._code_map = {member.code: member for member in cls}

    @classmethod
    def get_by_code(cls, code):
        """通过code获取枚举成员（字典实现）"""
        cls._initialize_code_map()
        return cls._code_map.get(code)
