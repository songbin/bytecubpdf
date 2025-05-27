export interface Term {
    id: number
    sourceTerm: string
    translatedTerm: string
     /** 创建时间 */
    createdAt?: string;
     /** 更新时间 */
    updatedAt?: string;
    ext1?: string
    ext2?: string
    ext3?: string
    ext4?: string
    ext5?: string
    ext6?: string
    ext7?: string
    ext8?: string
  }

  // 新增分页参数类型定义
export interface PagingParams {
  page?: number
  pageSize?: number
  keyword?: string
}

// 新增分页响应类型
export interface PagingResponse<T> {
  items: T[]
  total: number
}