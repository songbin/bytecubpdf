import { app } from 'electron';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs'; // 静态导入 fs
import BuildPath from './BuildPath';

export class SqliteDBInit {
    private static instance: SqliteDBInit;
    private dbPath: string = '';
    private db: Database | null = null; // 明确类型

    private constructor() {}

    public static getInstance(): SqliteDBInit {
        if (!SqliteDBInit.instance) {
            SqliteDBInit.instance = new SqliteDBInit();
        }
        return SqliteDBInit.instance;
    }
    //写一个文件存储列表创建的function，记录文件名 md5值 文件内容 文件类型 关联messageId chatId 
    private async createFileStoreTable(db:any) {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chat_file_store (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL, -- 文件名
                file_md5 TEXT NOT NULL, -- 文件md5值
                file_content TEXT NOT NULL, -- 文件内容
                file_type TEXT NOT NULL, -- 文件类型
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
        await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_file_store_chat_msg ON chat_file_store(chat_id, msg_id)');
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS update_chat_file_store_timestamp 
            AFTER UPDATE ON chat_file_store 
            BEGIN
                UPDATE chat_file_store SET update_time = CURRENT_TIMESTAMP WHERE id = OLD.id;
            END
        `);
    }
    //写一个聊天历史记录的表的创建function，是用于存储ai对话
    private async createChatMessageHistoryTable(db:any) {
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
    // 写一个用于存储聊天本地信息的表的创建函数
    private async createChatHistroyTable(db: any) {
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

    // 在 initTables 方法中调用该函数，需要在 initTables 方法中调用以下代码，这里仅作函数声明
    
    public async initTables(): Promise<void> {
        this.dbPath = BuildPath.getDbPath();
        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            console.log(`数据库初始化准备: ${this.dbPath}`);
            await this.createChatMessageHistoryTable(this.db)
            await this.createChatHistroyTable(this.db)
            await this.createFileStoreTable(this.db)
            // 创建平台表
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS llm_platforms (
                    id TEXT PRIMARY KEY,
                    platformName TEXT NOT NULL DEFAULT '',
                    protocolType TEXT NOT NULL DEFAULT '',
                    apiKey TEXT NOT NULL DEFAULT '',
                    apiUrl TEXT NOT NULL DEFAULT '',
                    isActive BOOLEAN DEFAULT 1,
                    ext1 TEXT NOT NULL DEFAULT '',  -- 扩展字段1
                    ext2 TEXT NOT NULL DEFAULT '',  -- 扩展字段2
                    ext3 TEXT NOT NULL DEFAULT '',  -- 扩展字段3
                    ext4 TEXT NOT NULL DEFAULT '',  -- 扩展字段4
                    ext5 TEXT NOT NULL DEFAULT '',  -- 扩展字段5
                    ext6 TEXT NOT NULL DEFAULT '',  -- 扩展字段6
                    ext7 TEXT NOT NULL DEFAULT '',  -- 扩展字段7
                    ext8 TEXT NOT NULL DEFAULT '',  -- 扩展字段8
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 创建模型表（添加主键）
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS llm_models (
                    auto_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id TEXT NOT NULL DEFAULT '',
                    platformId TEXT NOT NULL DEFAULT '',
                    name TEXT NOT NULL DEFAULT '',
                    types TEXT NOT NULL DEFAULT '[]',
                    pricingType TEXT NOT NULL DEFAULT 'free',
                    supportTools BOOLEAN NOT NULL DEFAULT FALSE,
                    groupName TEXT NOT NULL DEFAULT '',
                    isEnabled BOOLEAN NOT NULL DEFAULT TRUE,
                    ext1 TEXT NOT NULL DEFAULT '',  -- 扩展字段1
                    ext2 TEXT NOT NULL DEFAULT '',  -- 扩展字段2
                    ext3 TEXT NOT NULL DEFAULT '',  -- 扩展字段3
                    ext4 TEXT NOT NULL DEFAULT '',  -- 扩展字段4
                    ext5 TEXT NOT NULL DEFAULT '',  -- 扩展字段5
                    ext6 TEXT NOT NULL DEFAULT '',  -- 扩展字段6
                    ext7 TEXT NOT NULL DEFAULT '',  -- 扩展字段7
                    ext8 TEXT NOT NULL DEFAULT '',  -- 扩展字段8
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(platformId) REFERENCES llm_platforms(id)
                )
            `);
            // 创建翻译历史记录表
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS translate_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platformId TEXT NOT NULL DEFAULT '',
                    platformName TEXT NOT NULL DEFAULT '',
                    modelId TEXT NOT NULL DEFAULT '',
                    modelName TEXT NOT NULL DEFAULT '',
                    sourceFile TEXT NOT NULL DEFAULT '',
                    targetFile TEXT NOT NULL DEFAULT '',
                    sourceLanguage TEXT NOT NULL DEFAULT '',
                    targetLanguage TEXT NOT NULL DEFAULT '',
                    timeConsumed INTEGER NOT NULL DEFAULT 0,
                    totalPages INTEGER NOT NULL DEFAULT 0,
                    translationEngine TEXT NOT NULL DEFAULT '',
                    ext1 TEXT NOT NULL DEFAULT '',
                    ext2 TEXT NOT NULL DEFAULT '',
                    ext3 TEXT NOT NULL DEFAULT '',
                    ext4 TEXT NOT NULL DEFAULT '',
                    ext5 TEXT NOT NULL DEFAULT '',
                    ext6 TEXT NOT NULL DEFAULT '',  -- 扩展字段6
                    ext7 TEXT NOT NULL DEFAULT '',  -- 扩展字段7
                    ext8 TEXT NOT NULL DEFAULT '',  -- 扩展字段8
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            //创建翻译术语表
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS translate_terms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sourceTerm TEXT NOT NULL DEFAULT '',
                    translatedTerm TEXT NOT NULL DEFAULT '',
                    ext1 TEXT NOT NULL DEFAULT '',
                    ext2 TEXT NOT NULL DEFAULT '',
                    ext3 TEXT NOT NULL DEFAULT '',
                    ext4 TEXT NOT NULL DEFAULT '',
                    ext5 TEXT NOT NULL DEFAULT '',
                    ext6 TEXT NOT NULL DEFAULT '',
                    ext7 TEXT NOT NULL DEFAULT '',
                    ext8 TEXT NOT NULL DEFAULT '',
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            // 可选：添加触发器自动更新 updatedAt
            await this.db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_platform_timestamp 
                AFTER UPDATE ON llm_platforms 
                BEGIN
                    UPDATE llm_platforms SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
                END
            `);
            
            await this.db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_term_timestamp 
                AFTER UPDATE ON translate_terms 
                BEGIN
                    UPDATE translate_terms SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
                END
            `);
            
            // 新增初始化数据
            await this.initData();
        } catch (err) {
            throw new Error(`数据库初始化失败: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    private async initData(): Promise<void> {
        if (!this.db) return;

        try {
            await this.db.exec('BEGIN TRANSACTION');

            // 初始化平台数据 - 逐条检查并插入
            const platforms = [
                { id: 'zhipu', platformName: '智谱AI', protocolType: 'openai', apiKey: '', apiUrl: 'https://open.bigmodel.cn/api/paas/v4' },
                { id: 'deepseek', platformName: 'DeepSeek', protocolType: 'openai', apiKey: '', apiUrl: 'https://api.deepseek.com/v1' },
                { id: 'silicon', platformName: '硅基流动', protocolType: 'openai', apiKey: '', apiUrl: 'https://api.siliconflow.cn/v1' },
                { id: 'ollama', platformName: 'Ollama', protocolType: 'ollama', apiKey: '', apiUrl: 'http://127.0.0.1:11434' }
            ];

            for (const platform of platforms) {
                const exists = await this.db.get<{count: number}>(
                    'SELECT COUNT(*) as count FROM llm_platforms WHERE id = ?',
                    [platform.id]
                );
                if (!exists || exists.count === 0) {
                    await this.db.run(
                        'INSERT INTO llm_platforms (id, platformName, protocolType, apiKey, apiUrl) VALUES (?, ?, ?, ?, ?)',
                        [platform.id, platform.platformName, platform.protocolType, platform.apiKey, platform.apiUrl]
                    );
                }
            }

            // 初始化模型数据 - 逐条检查并插入
            const models = [
                // 智谱AI模型
                { id: 'GLM-4-Flash', platformId: 'zhipu', name: 'GLM-4-Flash', type: '["text"]' },
                { id: 'GLM-4-Plus', platformId: 'zhipu', name: 'GLM-4-Plus', type: '["text"]' },
                { id: 'GLM-4V-Flash', platformId: 'zhipu', name: 'GLM-4V-Flash', type: '["vision"]' },
                
                // DeepSeek模型
                { id: 'deepseek-chat', platformId: 'deepseek', name: 'deepseek-chat', type: '["text"]' },
                
                // 硅基流动模型
                { id: 'Qwen/QwQ-32B', platformId: 'silicon', name: 'QwQ-32B', type: '["text"]' },
                { id: 'deepseek-ai/DeepSeek-V3', platformId: 'silicon', name: 'DeepSeek-V3', type: '["text"]' },
                { id: 'deepseek-ai/DeepSeek-R1', platformId: 'silicon', name: 'DeepSeek-R1', type: '["text"]' },
                { id: 'Pro/deepseek-ai/DeepSeek-V3', platformId: 'silicon', name: 'DeepSeek-V3(Pro)', type: '["text"]' },
                { id: 'Pro/deepseek-ai/DeepSeek-R1', platformId: 'silicon', name: 'DeepSeek-R1(Pro)', type: '["text"]' },
                { id: 'Qwen/Qwen2.5-VL-72B-Instruct', platformId: 'silicon', name: 'Qwen/Qwen2.5-VL-72B-Instruct', type: '["vision"]' },
                
                // Ollama模型
                { id: 'qwen2.5:0.5b', platformId: 'ollama', name: 'qwen2.5:0.5b', type: '["text"]' },
                { id: 'llama3-70b', platformId: 'ollama', name: 'Llama3-70B', type: '["text"]' },
                { id: 'llama3-8b', platformId: 'ollama', name: 'Llama3-8B', type: '["text"]' },
                { id: 'ZimaBlueAI/Qwen2.5-VL-7B-Instruct', platformId: 'ollama', name: 'ZimaBlueAI/Qwen2.5-VL-7B-Instruct', type: '["vision"]' },
            ];

            for (const model of models) {
                const exists = await this.db.get<{count: number}>(
                    'SELECT COUNT(*) as count FROM llm_models WHERE id = ? AND platformId = ?',
                    [model.id, model.platformId]
                );
                if (!exists || exists.count === 0) {
                    await this.db.run(
                        'INSERT INTO llm_models (id, platformId, name, types) VALUES (?, ?, ?, ?)',
                        [model.id, model.platformId, model.name, model.type]
                    );
                }
            }
            await this.db.exec('COMMIT');
            console.log('数据库初始化数据完成');
        } catch (err) {
            await this.db?.exec('ROLLBACK');
            console.error('数据库初始化数据失败:', err);
            throw err;
        }
    }

    public async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

export const sqliteDBInit = SqliteDBInit.getInstance();