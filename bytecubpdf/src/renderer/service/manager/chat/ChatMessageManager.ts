import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';
import { ChatMessageDb } from '@/renderer/model/chat/db/ChatMessageDb';

export class ChatMessageManager {
    private readonly tableName = 'chat_message_history';

    // 字符串安全处理
    private sanitizeString(value: any): string {
        return typeof value === 'string' ? value.replace(/'/g, "''") : String(value ?? '');
    }

    // 创建聊天消息
    async createMessage(message: Omit<ChatMessageDb, 'id'|'create_time'|'update_time'>): Promise<number> {
        const sanitizedValues = [
            this.sanitizeString(message.chat_id),
            this.sanitizeString(message.key),
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
                key,
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
                ext8
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, sanitizedValues);
        return result[0]?.lastInsertRowid || 0;
    }

    // 根据会话ID获取消息列表
    async getMessagesByChatId(chatId: string): Promise<ChatMessageDb[]> {
        return SqliteDbCore.executeQuery(`
            SELECT * FROM ${this.tableName}
            WHERE chat_id = ?
            ORDER BY create_time ASC
        `, [this.sanitizeString(chatId)]);
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
            WHERE chat_id = ? AND key = ?
        `, [this.sanitizeString(newContent), sanitizedChatId, sanitizedKey]);
        return result[0]?.changes! > 0;
    }

    // 根据chat_id和key删除消息
    async deleteMessageByChatIdAndKey(chatId: string, key: string): Promise<boolean> {
        const sanitizedChatId = this.sanitizeString(chatId);
        const sanitizedKey = this.sanitizeString(key);
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            DELETE FROM ${this.tableName}
            WHERE chat_id = ? AND key = ?
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