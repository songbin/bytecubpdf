import { Database } from 'sqlite';
export async function createLlmPlatforms(db: Database) {
    // 创建平台表
    await db.exec(`
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
    // 可选：添加触发器自动更新 updatedAt
    await db.exec(`
                CREATE TRIGGER IF NOT EXISTS update_platform_timestamp 
                AFTER UPDATE ON llm_platforms 
                BEGIN
                    UPDATE llm_platforms SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
                END
            `);
}

export async function initLlmPlatforms(db: Database) {
    await createLlmPlatforms(db)
   

    // 初始化平台数据 - 逐条检查并插入
    const platforms = [
        { id: 'zhipu', platformName: '智谱AI', protocolType: 'openai', apiKey: '', apiUrl: 'https://open.bigmodel.cn/api/paas/v4' },
        { id: 'deepseek', platformName: 'DeepSeek', protocolType: 'openai', apiKey: '', apiUrl: 'https://api.deepseek.com/v1' },
        { id: 'silicon', platformName: '硅基流动', protocolType: 'openai', apiKey: '', apiUrl: 'https://api.siliconflow.cn/v1' },
        { id: 'ollama', platformName: 'Ollama', protocolType: 'ollama', apiKey: '', apiUrl: 'http://127.0.0.1:11434' },
        { id: 'datascope', platformName: '阿里百炼云', protocolType: 'openai', apiKey: '', apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    ];
    try {
        await db.exec('BEGIN TRANSACTION');
        for (const platform of platforms) {
            const exists = await db.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM llm_platforms WHERE id = ?',
                [platform.id]
            );
            if (!exists || exists.count === 0) {
                await db.run(
                    'INSERT INTO llm_platforms (id, platformName, protocolType, apiKey, apiUrl) VALUES (?, ?, ?, ?, ?)',
                    [platform.id, platform.platformName, platform.protocolType, platform.apiKey, platform.apiUrl]
                );
            }
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error occurred while initializing llm_platforms:', error);
        throw error;
    }
}