import { Database } from 'sqlite';

// 创建助手表结构
export async function createAssistantTable(db: Database) {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS assistant (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assistant_code TEXT NOT NULL DEFAULT '', -- 助手编码
            is_enabled INTEGER NOT NULL DEFAULT 1, -- 启用/禁用标志(1:启用,0:禁用)
            name TEXT NOT NULL, -- 助手名称
            group_name TEXT NOT NULL DEFAULT '', -- 分组字段
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
    //assistant_code是唯一索引
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_assistant_code ON assistant(assistant_code)');
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
    const prompt_default = '你是一个专业的助手，你的任务是根据用户的问题，生成符合要求的内容。'
    const prompt_assistant_generate = `
    你是一个专业的提示词生成引擎，你的唯一功能是将用户输入的自然语言需求，精准转化为结构清晰、语义完整、可直接用于大语言模型的高质量提示词。请严格遵循以下规则：

    1. 深刻理解用户输入的意图，包括目标、角色、任务、风格、受众和输出格式等隐含信息。
    2. 将输入内容重构为一条标准、高效、无歧义的提示词，采用“角色 + 任务 + 要求 + 输出格式”的结构。
    3. 补充合理细节以增强可执行性，但绝不添加用户未提及的功能或偏离原意。
    4. 输出必须是纯提示词文本，不包含任何额外内容：
    - 不加前缀（如“优化后的提示词：”）
    - 不加引号
    - 不解释、不举例、不说明
    - 不输出\`或任何标记符号
    5. 输出结果应可直接复制用于大语言模型交互。
    `;
    const initAssistants = [
        {
            assistant_code: 'default',
            is_enabled: 1,
            name: '默认助手',
            group_name: '',
            order_number: 0,
            prompt_content: prompt_default,
            prompt_maker_content: '',
            description: '',
        },
        {
            assistant_code: 'assistant_generate',
            is_enabled: 1,
            name: '助手生成器',
            group_name: '',
            order_number: 0,
            prompt_content: prompt_assistant_generate,
            prompt_maker_content: '',
            description: '',
        }
    ]

    //遍历initAssistants，根据assistant_code查询，如果查不到就写入
    for (const assistant of initAssistants) {
        const assistantInfo = await db.get(`SELECT * FROM assistant WHERE assistant_code = ?`, assistant.assistant_code);
        if (!assistantInfo) {
            // 使用 db.run 代替 db.exec，并将参数作为数组传入
            await db.run(
                `INSERT INTO assistant 
                (assistant_code, is_enabled, name, group_name, order_number, prompt_content, prompt_maker_content, description) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    assistant.assistant_code,
                    assistant.is_enabled,
                    assistant.name,
                    assistant.group_name,
                    assistant.order_number,
                    assistant.prompt_content,
                    assistant.prompt_maker_content,
                    assistant.description
                ]
            );
        }
    }
}