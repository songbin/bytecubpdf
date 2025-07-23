import { Database } from 'sqlite';

// 创建助手表结构
export async function createAssistantTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS assistant (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_enabled INTEGER NOT NULL DEFAULT 1, -- 启用/禁用标志(1:启用,0:禁用)
            name TEXT NOT NULL, -- 助手名称
            order_number INTEGER NOT NULL DEFAULT 0, -- 排序
            prompt_content TEXT NOT NULL DEFAULT '', -- 提示词内容
            prompt_maker_content TEXT NOT NULL DEFAULT '', -- 提示词制作内容
            description TEXT NOT NULL DEFAULT '', -- 助手描述
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

    // 创建索引
    await db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_name ON assistant(name)');
    await db.exec('CREATE INDEX IF NOT EXISTS idx_assistant_create_time ON assistant(create_time)');

    // 创建更新时间触发器
    await db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_assistant_timestamp 
        AFTER UPDATE ON assistant 
        BEGIN
            UPDATE assistant SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END
    `);
}

export async function AssistantInitData(db: Database) {
     // 初始化一个默认助手，名字是默认助手，其他都是空
     await db.exec(`
         INSERT INTO assistant (name) 
         SELECT '默认助手' 
         WHERE NOT EXISTS (
             SELECT 1 FROM assistant WHERE name = '默认助手'
         )
     `);
}