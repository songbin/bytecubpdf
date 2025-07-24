/**
 * 翻译历史记录实体
 */
export interface TranslateHistory {
  /** 记录ID */
  id?: number;
  /** 平台ID */
  platformId: string;
  /** 平台名称 */
  platformName: string;
  /** 模型ID */
  modelId: string;
  /** 模型名称 */
  modelName: string;
  /** 源文件路径 */
  sourceFile: string;
  /** 目标文件路径 */
  targetFile: string;
  /** 源语言代码 */
  sourceLanguage: string;
  /** 目标语言代码 */
  targetLanguage: string;
  /** 耗时（秒） */
  timeConsumed: number;
  /** 总页数 */
  totalPages: number;
  /** 使用的翻译引擎 */
  translationEngine: string;
  /** 扩展字段1-8 */
  ext1?: string;
  ext2?: string;//原生对照文件路径
  ext3?: string;
  ext4?: string;
  ext5?: string;
  ext6?: string;
  ext7?: string;
  ext8?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 翻译结果统计视图类型
 */
export interface TranslateStats {
  /** 翻译引擎名称 */
  engine: string;
  /** 总耗时（秒） */
  totalTime: number;
  /** 总页数 */
  totalPages: number;
  /** 平台ID（用于筛选） */
  platformId?: string;
  /** 模型ID（用于筛选） */
  modelId?: string;
}