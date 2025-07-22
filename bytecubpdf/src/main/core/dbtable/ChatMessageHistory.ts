    //写一个聊天历史记录的表的创建function，是用于存储ai对话
    export async function createChatMessageHistoryTable(db: any) {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chat_message_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL, -- 会话ID
                msg_id TEXT NOT NULL, -- 唯一标识
                nowTime TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                reasoning_content TEXT,
                file_list TEXT NOT NULL DEFAULT '[]', -- 文件标识,文件名数组
                create_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
                update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                ext1 TEXT NOT NULL DEFAULT '',  -- 扩展字段1
                ext2 TEXT NOT NULL DEFAULT '',  -- 扩展字段2
                ext3 TEXT NOT NULL DEFAULT '',  -- 扩展字段3
                ext4 TEXT NOT NULL DEFAULT '',  -- 扩展字段4
                ext5 TEXT NOT NULL DEFAULT '',  -- 扩展字段5
                ext6 TEXT NOT NULL DEFAULT '',  -- 扩展字段6
                ext7 TEXT NOT NULL DEFAULT '',  -- 扩展字段7
                ext8 TEXT NOT NULL DEFAULT '',  -- 扩展字段8
                ext9 TEXT NOT NULL DEFAULT '',  -- 扩展字段9
                ext10 TEXT NOT NULL DEFAULT '',  -- 扩展字段10
                ext11 TEXT NOT NULL DEFAULT '',  -- 扩展字段11
                ext12 TEXT NOT NULL DEFAULT '',  -- 扩展字段12
                ext13 TEXT NOT NULL DEFAULT '', -- 扩展字段13
                ext14 TEXT NOT NULL DEFAULT '',  -- 扩展字段14
                ext15 TEXT NOT NULL DEFAULT '',  -- 扩展字段15
                ext16 TEXT NOT NULL DEFAULT '',  -- 扩展字段16
                ext17 TEXT NOT NULL DEFAULT '',  -- 扩展字段17
                ext18 TEXT NOT NULL DEFAULT '',  -- 扩展字段18
                ext19 TEXT NOT NULL DEFAULT '',  -- 扩展字段19
                ext20 TEXT NOT NULL DEFAULT ''  -- 扩展字段20
            )
        `);
        await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_message_history_chat_id ON chat_message_history(chat_id)');
        await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_message_history_create_time ON chat_message_history(create_time)');
        await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_message_history_chat_msg ON chat_message_history(chat_id, msg_id)');
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_chat_message_history_timestamp 
            AFTER UPDATE ON chat_message_history 
            BEGIN
                UPDATE chat_message_history SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END
        `);
    }