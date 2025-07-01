/**
 * 对应数据库中的聊天消息实体
 */
export interface ChatMessageDb {
    // 数据库主键，自增
    id: number;
    // 会话ID
    chat_id: string;
    // 唯一标识
    msg_id: string;
    // 当前时间
    nowTime: string;
    // 角色
    role: string;
    // 内容
    content: string;
    // 推理内容
    reasoning_content?: string;
    file_name?: string;
    // 创建时间，默认为当前时间
    create_time?: string;
    // 更新时间，默认为当前时间
    update_time?: string;
    // 扩展字段1
    ext1?: string;
    // 扩展字段2
    ext2?: string;
    // 扩展字段3
    ext3?: string;
    // 扩展字段4
    ext4?: string;
    // 扩展字段5
    ext5?: string;
    // 扩展字段6
    ext6?: string;
    // 扩展字段7
    ext7?: string;
    // 扩展字段8
    ext8?: string;
}
