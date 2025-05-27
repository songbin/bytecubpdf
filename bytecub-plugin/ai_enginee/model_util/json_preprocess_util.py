
import re
import json
from typing import Optional, Union
class JsonPreprocessUtil:

    """
    JSON 字符串预处理工具类，用于修复常见的 JSON 格式问题
    """

    def fix_quotes(self,json_str: str) -> str:
        """
        将单引号替换为双引号，并确保属性名和字符串值用双引号包裹
        """
        # 将单引号替换为双引号
        json_str = json_str.replace("'", '"')
        # 修复属性名缺少双引号的情况（如 {key: "value"} -> {"key": "value"}）
        json_str = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', json_str)
        return json_str


    def remove_comments(self,json_str: str) -> str:
        """
        移除 JSON 字符串中的注释（如 // 或 /* */）
        """
        # 移除单行注释
        json_str = re.sub(r'//.*', '', json_str)
        # 移除多行注释
        json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
        return json_str

    def extract_json_data(self,json_str: str) -> str:
        """
        从包含 ```json 和 ``` 标记的文本中提取并解析 JSON 数据
        返回解析后的 Python 字典对象，失败时返回 None
        """
        # 定义标记
        start_marker = '```json'
        end_marker = '```'
        
        # 查找标记位置
        start_idx = json_str.find(start_marker)
        if start_idx == -1:
            return json_str
        # 计算实际内容起始位置
        start_idx += len(start_marker)
        # 查找结束标记
        end_idx = json_str.find(end_marker, start_idx)
        if end_idx == -1:
            return json_str
        # 提取并清理内容
        json_str = json_str[start_idx:end_idx].strip()
        return json_str




    # ... 其他代码保持不变 ...

    def extract_json(self,json_str: str) -> Optional[Union[dict, list, str, int, float, bool]]:
        """
        参数:
            json_str (str): 可能包含 JSON 的原始字符串
        返回:
            Optional[Union[dict, list, str, int, float, bool]]: 解析成功的 JSON 对象，找不到返回 None
        """
        if not isinstance(json_str, str) or not json_str:
            return None

        valid_starts = {'{', '[', '"', 't', 'f', 'n', '-'} | set(str(i) for i in range(10))
        max_length = -1
        best_json = None
        n = len(json_str)
        
        for i in range(n):
            char = json_str[i]
            if char not in valid_starts:
                continue
                
            # 剩余长度不足时提前终止
            remaining = n - i
            if remaining <= max_length:
                break
                
            # 从i+max_length开始扫描（优化点）
            start_j = min(i + max_length + 1, n - 1)
            for j in range(start_j, n):
                substr = json_str[i:j+1]
                try:
                    data = json.loads(substr)
                    current_length = j + 1 - i
                    if current_length > max_length:
                        max_length = current_length
                        best_json = data
                        # 找到后直接跳到下一个i，避免重复扫描
                        i = j
                        break
                except json.JSONDecodeError:
                    continue
                    
        return best_json

    # ... 其他代码保持不变 ...

    def preprocess(self,json_str: str) -> str:
        """
        非空处理JSON字符串
        """
        if not json_str:
            return json_str
        """
        预处理 JSON 字符串，修复常见问题
        """
        # 去掉多余的 ````json` 和 ```` 符号
        json_str = self.extract_json_data(json_str)
        #深度清理和修复json字符串
        json_str = self.fix_quotes(json_str)
        json_str = self.remove_comments(json_str)
        # 第二步：尝试解析为JSON对象
        try:
            json_obj = json.loads(json_str)
            # 如果是有效JSON直接返回序列化结果
            return json.dumps(json_obj, ensure_ascii=False)
        except json.JSONDecodeError:
            pass
        json_obj = self.extract_json(json_str)
          # 如果解析成功，重新序列化为字符串处理
        if json_obj is not None:
            json_str = json.dumps(json_obj, ensure_ascii=False)    
        return json_str.strip()
