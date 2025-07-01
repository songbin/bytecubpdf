import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';
import { ChatHistory } from '@/renderer/model/chat/db/ChatHistory';

export class ChatHistoryManager {
    private readonly tableName = 'chat_history';

    // 字符串安全处理方法
    private sanitizeString(value: any): string {
        return typeof value === 'string' ? value.replace(/'/g, "''") : String(value ?? '');
    }

    // 创建聊天会话
    async createChatHistory(history: Omit<ChatHistory, 'id'|'create_time'|'update_time'>): Promise<number> {
        const sanitizedValues = [
            this.sanitizeString(history.chat_id),
            this.sanitizeString(history.chat_name),
            this.sanitizeString(history.ext1),
            this.sanitizeString(history.ext2),
            this.sanitizeString(history.ext3),
            this.sanitizeString(history.ext4),
            this.sanitizeString(history.ext5),
            this.sanitizeString(history.ext6),
            this.sanitizeString(history.ext7),
            this.sanitizeString(history.ext8)
        ];

        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(`
            INSERT INTO ${this.tableName} (
                chat_id,
                chat_name,
                ext1,
                ext2,
                ext3,
                ext4,
                ext5,
                ext6,
                ext7,
                ext8
            ) VALUES (?,?,?,?,?,?,?,?,?,?)
        `, sanitizedValues);
        return result[0]?.lastInsertRowid || 0;
    }

    // 分页获取聊天会话
    async getChatHistoryPage(chatName:string, pageno = 1, pageSize = 20): Promise<ChatHistory[]> {
         const offset = (Math.max(1, pageno) - 1) * pageSize;
        const sanitizedKeyword = this.sanitizeString(chatName);
        return SqliteDbCore.executeQuery<ChatHistory>(`
            SELECT 
                id, chat_id, chat_name, file_md5, 
                create_time, update_time, 
                ext1, ext2, ext3, ext4, ext5, ext6, ext7, ext8 
            FROM ${this.tableName}
            WHERE chat_name LIKE ?
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [`%${sanitizedKeyword}%`, pageSize, offset]);
    }

    // 获取会话总数量
    async getChatHistoryTotalCount(): Promise<number> {
        const result = await SqliteDbCore.executeQuery<{ count: number }>(`
            SELECT COUNT(*) as count FROM ${this.tableName}
        `);
        return result[0]?.count || 0;
    }

    // 更新会话名称
    async updateChatHistoryName(chatId: string, newName: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            UPDATE ${this.tableName}
            SET chat_name = ?,
                update_time = CURRENT_TIMESTAMP
            WHERE chat_id = ?
        `, [this.sanitizeString(newName), this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }
    //更新file_md5
    async updateChatHistoryFileMd5(chatId: string, fileMd5: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            UPDATE ${this.tableName}
            SET file_md5 = ?,
                update_time = CURRENT_TIMESTAMP
            WHERE chat_id = ?
        `, [this.sanitizeString(fileMd5), this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }

    async updateFileMd5AndContent(chatId: string, fileMd5: string, fileContent: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            UPDATE ${this.tableName}
            SET file_md5 = ?,
                file_content = ?,
                update_time = CURRENT_TIMESTAMP
            WHERE chat_id = ?
        `, [this.sanitizeString(fileMd5), this.sanitizeString(fileContent), this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }

    // 删除会话
    async deleteChatHistory(chatId: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            DELETE FROM ${this.tableName}
            WHERE chat_id = ?
        `, [this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }

    //实现根据chat_id查询的function
    async getChatHistoryByChatId(chatId: string): Promise<ChatHistory | null> {
        const result = await SqliteDbCore.executeQuery<ChatHistory>(`
            SELECT * FROM ${this.tableName}
            WHERE chat_id = ?
        `, [this.sanitizeString(chatId)]);
        return result[0] || null;
    }
    
    async searchChatHistoryByName(keyword: string, pageno = 1, pageSize = 20): Promise<ChatHistory[]> {
        const offset = (Math.max(1, pageno) - 1) * pageSize;
        const sanitizedKeyword = this.sanitizeString(keyword);
        return SqliteDbCore.executeQuery<ChatHistory>(`
            SELECT * FROM ${this.tableName}
            WHERE chat_name LIKE ?
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [`%${sanitizedKeyword}%`, pageSize, offset]);
    }
    
}