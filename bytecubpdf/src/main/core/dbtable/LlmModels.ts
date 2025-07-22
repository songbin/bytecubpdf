import { Database } from 'sqlite';
import { dictConfig } from '@/main/core/dbconfig/DictConfig';
export async function createLlmModelsTable(db: Database) {
    // 创建模型表（添加主键）
    await db.exec(`
                CREATE TABLE IF NOT EXISTS llm_models (
                    auto_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    id TEXT NOT NULL DEFAULT '',
                    platformId TEXT NOT NULL DEFAULT '',
                    name TEXT NOT NULL DEFAULT '',
                    types TEXT NOT NULL DEFAULT '[]',
                    pricingType TEXT NOT NULL DEFAULT '',
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
}
export async function initLlmModels(db: Database) {
    await createLlmModelsTable(db)
    // 初始化模型数据 - 逐条检查并插入
    const models = [
        // 智谱AI模型
        { id: 'GLM-4-Flash', platformId: 'zhipu', name: 'GLM-4-Flash', type: '["text"]', pricingType: 'free' },
        { id: 'GLM-4-Plus', platformId: 'zhipu', name: 'GLM-4-Plus', type: '["text"]', pricingType: 'charge' },
        { id: 'GLM-4V-Flash', platformId: 'zhipu', name: 'GLM-4V-Flash', type: '["vision"]', pricingType: 'free' },

        // DeepSeek模型
        { id: 'deepseek-chat', platformId: 'deepseek', name: 'deepseek-chat', type: '["text"]', pricingType: 'charge' },

        // 硅基流动模型
        { id: 'Qwen/QwQ-32B', platformId: 'silicon', name: 'QwQ-32B', type: '["text"]', pricingType: 'charge' },
        { id: 'deepseek-ai/DeepSeek-V3', platformId: 'silicon', name: 'DeepSeek-V3', type: '["text"]', pricingType: 'charge' },
        { id: 'deepseek-ai/DeepSeek-R1', platformId: 'silicon', name: 'DeepSeek-R1', type: '["text"]', pricingType: 'charge' },
        { id: 'Pro/deepseek-ai/DeepSeek-V3', platformId: 'silicon', name: 'DeepSeek-V3(Pro)', type: '["text"]', pricingType: 'charge' },
        { id: 'Pro/deepseek-ai/DeepSeek-R1', platformId: 'silicon', name: 'DeepSeek-R1(Pro)', type: '["text"]', pricingType: 'charge' },
        { id: 'Qwen/Qwen2.5-VL-72B-Instruct', platformId: 'silicon', name: 'Qwen/Qwen2.5-VL-72B-Instruct', type: '["vision"]', pricingType: 'charge' },

        // Ollama模型
        { id: 'qwen2.5:0.5b', platformId: 'ollama', name: 'qwen2.5:0.5b', type: '["text"]', pricingType: 'free' },
        { id: 'llama3-70b', platformId: 'ollama', name: 'Llama3-70B', type: '["text"]', pricingType: 'free' },
        { id: 'llama3-8b', platformId: 'ollama', name: 'Llama3-8B', type: '["text"]', pricingType: 'free' },
        { id: 'ZimaBlueAI/Qwen2.5-VL-7B-Instruct', platformId: 'ollama', name: 'ZimaBlueAI/Qwen2.5-VL-7B-Instruct', type: '["vision"]', pricingType: 'free' },

        // 阿里百炼云模型
        { id: 'qwen3-32b', platformId: 'datascope', name: 'qwen3-32b', type: '["text"]', pricingType: 'charge' },
        { id: 'qwen3-235b-a22b', platformId: 'datascope', name: 'qwen3-235b-a22b', type: '["text"]', pricingType: 'charge' },

        { id: 'qwen/qwen3-235b-a22b-07-25:free', platformId: 'openrouter', name: 'qwen/qwen3-235b-a22b-07-25:free', type: '["text"]', pricingType: 'free' },
        { id: 'moonshotai/kimi-k2:free', platformId: 'openrouter', name: 'moonshotai/kimi-k2:free', type: '["text"]', pricingType: 'free' },
        { id: 'anthropic/claude-sonnet-4', platformId: 'openrouter', name: 'anthropic/claude-sonnet-4', type: '["text"]', pricingType: 'charge' },
        { id: 'google/gemini-2.5-flash', platformId: 'openrouter', name: 'google/gemini-2.5-flash', type: '["text"]', pricingType: 'charge' },
        { id: 'openai/gpt-4.1', platformId: 'openrouter', name: 'openai/gpt-4.1', type: '["text"]', pricingType: 'charge' },
        { id: 'deepseek/deepseek-r1-0528', platformId: 'openrouter', name: 'deepseek/deepseek-r1-0528', type: '["text"]', pricingType: 'charge' },
    ];
    try {
        await db.exec('BEGIN TRANSACTION');
        for (const model of models) {
            const exists = await db.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM llm_models WHERE id = ? AND platformId = ?',
                [model.id, model.platformId]
            );
            if (!exists || exists.count === 0) {
                await db.run(
                    'INSERT INTO llm_models (id, platformId, name, types) VALUES (?, ?, ?, ?)',
                    [model.id, model.platformId, model.name, model.type]
                );
            }
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        console.log('初始化模型数据失败:', error);
        throw error;
    }
}

export async function alterLlmModels(db: Database) {
    //查询配置表里的数据库版本
    const dbVersion = await db.get<{ value: string }>(
        'SELECT dict_value FROM sys_dict WHERE dict_code = ?',
        [dictConfig.dbVersionKey]
    );
    if (!dbVersion ) {
        //这是第一个版本
          // 确保现有字段pricingType的默认值为空字符串
          // 由于SQLite不支持直接修改列默认值，此处无需操作（表定义中已设置DEFAULT ''）
    }
}

export async function alterLlmModelsData(db: Database) {
    //查询配置表里的数据库版本
    const dbVersion = await db.get<{ value: string }>(
        'SELECT dict_value FROM sys_dict WHERE dict_code = ?',
        [dictConfig.dbVersionKey]
    );
    if (!dbVersion) {
        //这是第一个版本
        //把pricingType全部设置为空字符串
        try {
            await db.exec('BEGIN TRANSACTION');
            await db.exec(`
                UPDATE llm_models
                SET pricingType = ''
            `);
            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            console.error('Failed to update pricingType:', error);
            throw error;
        }
    }
}
