import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';
import { ChatMessageDb } from '@/renderer/model/chat/db/ChatMessageDb';

export class ChatMessageManager {
    private readonly tableName = 'chat_message_history';

    // 字符串安全处理
    private sanitizeString(value: any): string {
        return typeof value === 'string' ? value.replace(/'/g, "''") : String(value ?? '');
    }

    // 创建聊天消息
    async createMessage(message: Omit<ChatMessageDb, 'id' | 'create_time' | 'update_time'>): Promise<number> {
        const sanitizedValues = [
            this.sanitizeString(message.chat_id),
            this.sanitizeString(message.msg_id),
            this.sanitizeString(message.file_list),
            this.sanitizeString(message.nowTime),
            this.sanitizeString(message.role),
            this.sanitizeString(message.content),
            this.sanitizeString(message.reasoning_content),
            this.sanitizeString(message.ext1),
            this.sanitizeString(message.ext2),
            this.sanitizeString(message.ext3),
            this.sanitizeString(message.ext4),
            this.sanitizeString(message.ext5),
            this.sanitizeString(message.ext6),
            this.sanitizeString(message.ext7),
            this.sanitizeString(message.ext8)
        ];

        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(`
            INSERT INTO ${this.tableName} (
                chat_id,
                msg_id,
                file_list,
                nowTime,
                role,
                content,
                reasoning_content,
                ext1,
                ext2,
                ext3,
                ext4,
                ext5,
                ext6,
                ext7,
                ext8,
                create_time,
                update_time
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, sanitizedValues);
        return result[0]?.lastInsertRowid || 0;
    }

    // 根据会话ID获取消息列表
    async getMessagesByChatId(chatId: string): Promise<ChatMessageDb[]> {
        return SqliteDbCore.executeQuery(`
            SELECT * FROM ${this.tableName}
            WHERE chat_id = ?
            ORDER BY id ASC
        `, [this.sanitizeString(chatId)]);
    }
    async getMessageByChatIdAndMsgId(chatId: string, msgId: string): Promise<ChatMessageDb | null> {
        const result = await SqliteDbCore.executeQuery<ChatMessageDb>(`
            SELECT * FROM ${this.tableName}
            WHERE chat_id = ? AND msg_id = ?
        `, [this.sanitizeString(chatId), this.sanitizeString(msgId)]);
        return result[0] || null;
    }
    /**
     * 批量删除指定会话中的多个消息
     * @param chatId 会话ID
     * @param keys 消息唯一标识数组
     * @returns 是否全部删除成功
     */
    async deleteMessagesByChatIdAndKeys(chatId: string, keys: string[]): Promise<boolean> {
        if (!chatId) {
            throw new Error('会话ID不能为空');
        }
        if (!keys || keys.length === 0) {
            throw new Error('消息Key数组不能为空');
        }

        try {
            // 生成 IN 子句的占位符列表（如 ?, ?, ?）
            const placeholders = keys.map(() => '?').join(',');
            // 构造 SQL 语句（使用参数化查询）
            const sql = `
      DELETE FROM ${this.tableName}
      WHERE chat_id = ? AND msg_id IN (${placeholders})
    `;
            // 构造参数数组（第一个参数是 chatId，后面是 keys 数组的元素）
            const params = [chatId, ...keys];
            // 执行查询
            const result = await SqliteDbCore.executeQuery<{ changes: number }>(sql, params);
            // 返回是否成功删除消息
            return result[0]?.changes! > 0;
        } catch (error) {
            console.error(`批量删除会话[${chatId}]中的消息失败:`, error);
            throw new Error(`批量删除消息失败: ${(error as Error).message}`);
        }
    }
    // 更新消息内容
    // 根据chat_id和key更新消息内容
    async updateMessageByChatIdAndKey(chatId: string, key: string, newContent: string): Promise<boolean> {
        const sanitizedChatId = this.sanitizeString(chatId);
        const sanitizedKey = this.sanitizeString(key);
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            UPDATE ${this.tableName}
            SET content = ?,
                update_time = CURRENT_TIMESTAMP
            WHERE chat_id = ? AND msg_id = ?
        `, [this.sanitizeString(newContent), sanitizedChatId, sanitizedKey]);
        return result[0]?.changes! > 0;
    }

    // 根据chat_id和key删除消息
    async deleteMessageByChatIdAndKey(chatId: string, key: string): Promise<boolean> {
        const sanitizedChatId = this.sanitizeString(chatId);
        const sanitizedKey = this.sanitizeString(key);
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            DELETE FROM ${this.tableName}
            WHERE chat_id = ? AND msg_id = ?
        `, [sanitizedChatId, sanitizedKey]);
        return result[0]?.changes! > 0;
    }

    // 清空指定会话的所有消息
    async clearMessagesByChatId(chatId: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            DELETE FROM ${this.tableName}
            WHERE chat_id = ?
        `, [this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }
}