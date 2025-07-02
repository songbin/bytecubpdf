import { ChatFileStoreDb } from '@/renderer/model/chat/db/ChatFileStoreDb';
import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';

export class ChatFileStoreManager {
    private static instance: ChatFileStoreManager;
     private readonly tableName = 'file_store';

    private constructor() {}

    public static getInstance(): ChatFileStoreManager {
        if (!ChatFileStoreManager.instance) {
            ChatFileStoreManager.instance = new ChatFileStoreManager();
        }
        return ChatFileStoreManager.instance;
    }

    public async addFile(file: ChatFileStoreDb): Promise<number> {
        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(
            'INSERT INTO file_store (file_name, file_md5, file_content, file_type, msg_id, chat_id) VALUES (?, ?, ?, ?, ?, ?)',
            [file.file_name, file.file_md5, file.file_content, file.file_type, file.msg_id, file.chat_id]
        );
        return result[0]?.lastInsertRowid || 0;
    }

    public async getFileById(id: number): Promise<ChatFileStoreDb | null> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>('SELECT * FROM file_store WHERE id = ?', [id]);
        return result[0] || null;
    }

    public async getFilesByChatId(chatId: string): Promise<ChatFileStoreDb[]> {
        return await SqliteDbCore.executeQuery<ChatFileStoreDb>('SELECT * FROM file_store WHERE chat_id = ?', [chatId]);
    }

    public async getFilesByMsgId(msgId: string): Promise<ChatFileStoreDb[]> {
        return await SqliteDbCore.executeQuery<ChatFileStoreDb>('SELECT * FROM file_store WHERE msg_id = ?', [msgId]);
    }

    public async updateFileByChatAndMsg(chatId: string, msgId: string, file: Partial<ChatFileStoreDb>): Promise<boolean> {
        const fields = [];
        const values = [];

        if (file.file_name !== undefined) {
            fields.push('file_name = ?');
            values.push(file.file_name);
        }
        if (file.file_md5 !== undefined) {
            fields.push('file_md5 = ?');
            values.push(file.file_md5);
        }
        if (file.file_content !== undefined) {
            fields.push('file_content = ?');
            values.push(file.file_content);
        }
        if (file.file_type !== undefined) {
            fields.push('file_type = ?');
            values.push(file.file_type);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(chatId, msgId);
        const sql = `UPDATE file_store SET ${fields.join(', ')} WHERE chat_id = ? AND msg_id = ?`;
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(sql, values);
        return result[0]?.changes! > 0;
    }

    public async updateFile(id: number, file: Partial<ChatFileStoreDb>): Promise<boolean> {
        const fields = [];
        const values = [];

        if (file.file_name !== undefined) {
            fields.push('file_name = ?');
            values.push(file.file_name);
        }
        if (file.file_md5 !== undefined) {
            fields.push('file_md5 = ?');
            values.push(file.file_md5);
        }
        if (file.file_content !== undefined) {
            fields.push('file_content = ?');
            values.push(file.file_content);
        }
        if (file.file_type !== undefined) {
            fields.push('file_type = ?');
            values.push(file.file_type);
        }
        if (file.msg_id !== undefined) {
            fields.push('msg_id = ?');
            values.push(file.msg_id);
        }
        if (file.chat_id !== undefined) {
            fields.push('chat_id = ?');
            values.push(file.chat_id);
        }

        if (fields.length === 0) {
            return false;
        }

        values.push(id);
        const sql = `UPDATE file_store SET ${fields.join(', ')} WHERE id = ?`;
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(sql, values);
        return result[0]?.changes! > 0;
    }

    public async deleteFile(id: number): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>('DELETE FROM file_store WHERE id = ?', [id]);
        return result[0]?.changes! > 0;
    }

    public async deleteFilesByChatAndMsg(chatId: string, msgId: string): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(
            'DELETE FROM file_store WHERE chat_id = ? AND msg_id = ?', 
            [chatId, msgId]
        );
        return result[0]?.changes! > 0;
    }

    public async getFileByMd5(md5: string): Promise<ChatFileStoreDb[]> {
        const result = await SqliteDbCore.executeQuery<ChatFileStoreDb>('SELECT * FROM file_store WHERE file_md5 = ?', [md5]);
        return result;
    }

   
}

export const chatFileStoreManager = ChatFileStoreManager.getInstance();