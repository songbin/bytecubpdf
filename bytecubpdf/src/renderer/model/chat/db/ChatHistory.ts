/**
 * 聊天历史记录数据库实体接口
 */
export interface ChatHistory {
    id: number; // 主键ID
    chat_id: string; // 会话ID
    chat_name: string; // 会话名称
    file_md5?: string; // 文件md5
    create_time: string; // 创建时间
    update_time: string; // 更新时间
    ext1?: string; // 扩展字段1
    ext2?: string; // 扩展字段2
    ext3?: string; // 扩展字段3
    ext4?: string; // 扩展字段4
    ext5?: string; // 扩展字段5
    ext6?: string; // 扩展字段6
    ext7?: string; // 扩展字段7
    ext8?: string; // 扩展字段8
}
