# -*- coding: utf-8 -*-
"""
Font Deduplication Resource Manager for PDFMiner
"""

from typing import Optional, Tuple, Dict, Any
from pdfminer.pdffont import PDFFont
from pdfminer.pdfinterp import PDFResourceManager
from pdfminer.psparser import PSLiteral

# 自定义字体缓存键类型
FontCacheKey = Tuple[Optional[str], Optional[str]]

class DocFablePDFResourceManager(PDFResourceManager):
    """
    支持字体去重的资源管理器
    
    特性：
    - 基于 BaseFont + Encoding 的字体缓存
    - 防止重复嵌入相同字体
    - 支持复杂编码结构解析
    """
    
    def __init__(self):
        """初始化资源管理器并创建字体缓存"""
        super().__init__()
        self.font_cache: Dict[FontCacheKey, PDFFont] = {}
        self._cache_stats = {'hits': 0, 'misses': 0}

    def get_font(self, objid: Optional[int], spec: Dict[str, Any]) -> PDFFont:
        """
        重载字体加载方法，优先返回缓存字体
        
        参数:
            objid: 字体对象ID（可选）
            spec: 字体规格字典
            
        返回:
            PDFFont: 缓存或新创建的字体对象
        """
        # 提取关键特征
        base_font = spec.get('BaseFont')
        encoding = spec.get('Encoding')

        # 标准化编码表示
        encoding = self._normalize_encoding(encoding)
        
        # 生成缓存键
        cache_key = (
            str(base_font) if base_font else None,
            str(encoding) if encoding else None
        )

        # 缓存命中处理
        if cache_key in self.font_cache:
            self._cache_stats['hits'] += 1
            return self.font_cache[cache_key]

        # 缓存未命中：创建新字体
        font = super().get_font(objid, spec)
        self.font_cache[cache_key] = font
        self._cache_stats['misses'] += 1
        
        # 附加调试信息
        font.xobj_id = objid  # 保留原始对象ID信息
        return font

    def _normalize_encoding(self, encoding: Any) -> Optional[str]:
        """统一编码表示格式"""
        if encoding is None:
            return None
            
        if isinstance(encoding, dict):
            # 提取基础编码信息
            return str(encoding.get('BaseEncoding') or encoding.get('Type'))
            
        if isinstance(encoding, PSLiteral):
            return encoding.name
            
        return str(encoding)

    def get_cache_stats(self) -> Dict[str, int]:
        """获取缓存统计信息"""
        return self._cache_stats.copy()

    def clear_font_cache(self) -> None:
        """清空字体缓存"""
        self.font_cache.clear()
        self._cache_stats = {'hits': 0, 'misses': 0}