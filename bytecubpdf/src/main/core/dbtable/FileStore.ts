    //写一个文件存储列表创建的function，记录文件名 md5值 文件内容 文件类型 关联messageId chatId 
    export async function createFileStoreTable(db: any) {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chat_file_store (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL, -- 文件名
                file_md5 TEXT NOT NULL, -- 文件md5值
                file_content TEXT NOT NULL, -- 文件内容
                file_type TEXT NOT NULL, -- 文件类型
                file_extent TEXT NOT NULL, -- 文件后缀
                msg_id TEXT NOT NULL, -- 关联messageId
                chat_id TEXT NOT NULL, -- 关联chatId
                file_size INTEGER NOT NULL DEFAULT 0, -- 文件大小
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
        //创建索引，索引有md5 chatid msgid 等
        await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_file_store_file_md5 ON chat_file_store(file_md5)');
        await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_file_store_chat_id ON chat_file_store(chat_id)');
        await db.exec('CREATE INDEX IF NOT EXISTS idx_chat_file_store_msg_id ON chat_file_store(msg_id)');
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_chat_file_store_timestamp 
            AFTER UPDATE ON chat_file_store 
            BEGIN
                UPDATE chat_file_store SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END
        `);
    }