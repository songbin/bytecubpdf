import { ChatFileStoreDb } from '@/renderer/model/chat/db/ChatFileStoreDb';
import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';

export class ChatFileStoreManager {
    private static instance: ChatFileStoreManager;
     private readonly tableName = 'chat_file_store';

    private constructor() {}

    public static getInstance(): ChatFileStoreManager {
        if (!ChatFileStoreManager.instance) {
            ChatFileStoreManager.instance = new ChatFileStoreManager();
        }
        return ChatFileStoreManager.instance;
    }
    // 字符串安全处理
    private sanitizeString(value: any): string {
        return typeof value === 'string' ? value.replace(/'/g, "''") : String(value ?? '');
    }
    public async addFile(file: ChatFileStoreDb): Promise<number> {
        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(
            `INSERT INTO ${this.tableName} (file_name, file_md5, file_content, file_type, file_size, msg_id, chat_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                this.sanitizeString(file.file_name), 
                this.sanitizeString(file.file_md5), 
                file.file_content, 
                this.sanitizeString(file.file_type), 
                file.file_size, 
                this.sanitizeString(file.msg_id), 
                this.sanitizeString(file.chat_id)
            ]
        );
        return result[0]?.lastInsertRowid || 0;
    }

    public async getFileById(id: number): Promise<ChatFileStoreDb | null> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [this.sanitizeString(id)]);
        return result[0] || null;
    }

    public async getFilesByChatId(chatId: string): Promise<ChatFileStoreDb[]> {
        return await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE chat_id = ?`, [this.sanitizeString(chatId)]);
    }

    public async getFilesByMsgId(msgId: string): Promise<ChatFileStoreDb[]> {
        return await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE msg_id = ?`, [this.sanitizeString(msgId)]);
    }

    public async getFileByChatIdAndMsgId(chatId: string, msgId: string): Promise<ChatFileStoreDb[]> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE chat_id = ? AND msg_id = ?`, [this.sanitizeString(chatId), this.sanitizeString(msgId)]);
        return result;
    }

    public async updateFileByChatAndMsg(chatId: string, msgId: string, file: Partial<ChatFileStoreDb>): Promise<boolean> {
        const fields = [];
        const values = [];

        if (file.file_name !== undefined) {
            fields.push('file_name = ?');
            values.push(this.sanitizeString(file.file_name));
        }
        if (file.file_md5 !== undefined) {
            fields.push('file_md5 = ?');
            values.push(this.sanitizeString(file.file_md5));
        }
        if (file.file_content !== undefined) {
            fields.push('file_content = ?');
            values.push(file.file_content);
        }
        if (file.file_type !== undefined) {
            fields.push('file_type = ?');
            values.push(this.sanitizeString(file.file_type));
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(this.sanitizeString(chatId), this.sanitizeString(msgId));
        const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE chat_id = ? AND msg_id = ?`;
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(sql, values);
        return result[0]?.changes! > 0;
    }

    public async updateFile(id: number, file: Partial<ChatFileStoreDb>): Promise<boolean> {
        const fields = [];
        const values = [];

        if (file.file_name !== undefined) {
            fields.push('file_name = ?');
            values.push(this.sanitizeString(file.file_name));
        }
        if (file.file_md5 !== undefined) {
            fields.push('file_md5 = ?');
            values.push(this.sanitizeString(file.file_md5));
        }
        if (file.file_content !== undefined) {
            fields.push('file_content = ?');
            values.push(file.file_content);
        }
        if (file.file_type !== undefined) {
            fields.push('file_type = ?');
            values.push(this.sanitizeString(file.file_type));
        }
        if (file.msg_id !== undefined) {
            fields.push('msg_id = ?');
            values.push(this.sanitizeString(file.msg_id));
        }
        if (file.chat_id !== undefined) {
            fields.push('chat_id = ?');
            values.push(this.sanitizeString(file.chat_id));
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(this.sanitizeString(id));
        const sql = `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`;
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(sql, values);
        return result[0]?.changes! > 0;
    }

    public async deleteFile(id: number): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`DELETE FROM ${this.tableName} WHERE id = ?`, [this.sanitizeString(id)]);
        return result[0]?.changes! > 0;
    }

    public async deleteFilesByChatAndMsg(chatId: string, msgId: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(
            `DELETE FROM ${this.tableName} WHERE chat_id = ? AND msg_id = ?`, 
            [this.sanitizeString(chatId), this.sanitizeString(msgId)]
        );
        return result[0]?.changes! > 0;
    }
    public async deleteFilesByChatAndMsgIds(chatId: string, msgIds: string[]): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(
            `DELETE FROM ${this.tableName} WHERE chat_id = ? AND msg_id IN (${msgIds.map(() => '?').join(',')})`, 
            [this.sanitizeString(chatId), ...msgIds]
        );
        return result[0]?.changes! > 0;
    }
    public async getFileByMd5(md5: string): Promise<ChatFileStoreDb[]> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE file_md5 = ?`, [this.sanitizeString(md5)]);
        return result;
    }

    public async getFileByChatIdAndMd5(chatId: string, md5: string): Promise<ChatFileStoreDb[]> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>(`SELECT * FROM ${this.tableName} WHERE chat_id = ? AND file_md5 = ?`, [this.sanitizeString(chatId), this.sanitizeString(md5)]);
        return result;
    }

    public async deleteFilesByChatId(chatId: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`DELETE FROM ${this.tableName} WHERE chat_id = ?`, [this.sanitizeString(chatId)]);
        return result[0]?.changes! > 0;
    }
   
}

export const chatFileStoreManager = ChatFileStoreManager.getInstance();