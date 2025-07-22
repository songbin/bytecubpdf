// 写一个用于存储聊天本地信息的表的创建函数
export async function createChatHistoryTable(db: any) {
    await db.exec(`
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL, -- 会话ID
                chat_name TEXT NOT NULL, -- 会话名称
                create_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
                update_time DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
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
    await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_history_chat_id ON chat_history(chat_id)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_history_chat_name ON chat_history(chat_name)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_history_create_time ON chat_history(create_time)');
    await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_chat_history_timestamp 
            AFTER UPDATE ON chat_history 
            BEGIN
                UPDATE chat_history SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END
        `);
}