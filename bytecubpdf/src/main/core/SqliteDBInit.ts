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

    public async initTables(): Promise<void> {
        this.dbPath = BuildPath.getDbPath();
        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });
            console.log(`数据库初始化准备: ${this.dbPath}`);
            
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