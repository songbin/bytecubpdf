import { Assistant } from '@/renderer/model/assistant/AssistantDb';
import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';

export class AssistantManager {
    private readonly tableName = 'assistant';
    
    // 保存或更新助手
    public async saveAssistant(assistant: Partial<Assistant>): Promise<void> {
        if (!assistant.id) {
            // 新增助手
            await SqliteDbCore.insertData(this.tableName, {
                is_enabled: assistant.is_enabled ?? 1,
                name: assistant.name,
                order_number: assistant.order_number ?? 0,
                prompt_content: assistant.prompt_content ?? '',
                prompt_maker_content: assistant.prompt_maker_content ?? '',
                description: assistant.description ?? '',
                // 扩展字段根据需要添加
                ext1: assistant.ext1 ?? '',
                ext2: assistant.ext2 ?? '',
                ext3: assistant.ext3 ?? '',
                ext4: assistant.ext4 ?? '',
                ext5: assistant.ext5 ?? '',
                ext6: assistant.ext6 ?? '',
                ext7: assistant.ext7 ?? '',
                ext8: assistant.ext8 ?? '',
                ext9: assistant.ext9 ?? '',
                ext10: assistant.ext10 ?? '',
                ext11: assistant.ext11 ?? '',
                ext12: assistant.ext12 ?? '',
                ext13: assistant.ext13 ?? '',
                ext14: assistant.ext14 ?? '',
                ext15: assistant.ext15 ?? '',
                ext16: assistant.ext16 ?? '',
                ext17: assistant.ext17 ?? '',
                ext18: assistant.ext18 ?? '',
                ext19: assistant.ext19 ?? '',
                ext20: assistant.ext20 ?? ''
            });
        } else {
            // 更新现有助手
            await SqliteDbCore.executeQuery(`
                UPDATE ${this.tableName} SET
                    is_enabled = ?,
                    name = ?,
                    order_number = ?,
                    prompt_content = ?,
                    prompt_maker_content = ?,
                    description = ?
                WHERE id = ?
            `, [
                assistant.is_enabled,
                assistant.name,
                assistant.order_number,
                assistant.prompt_content,
                assistant.prompt_maker_content,
                assistant.description,
                assistant.id
            ]);
        }
    }

    // 获取所有助手，按order升序排列
    public async getAssistants(): Promise<Assistant[]> {
        const assistants = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.tableName} ORDER BY order_number ASC`
        ) as unknown[] || [];
        
        return assistants.map(assistant => assistant as Assistant);
    }

    // 获取单个助手
    public async getAssistant(id: number): Promise<Assistant | null> {
        const [assistant] = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        ) as unknown[] || [];
        
        return assistant ? (assistant as Assistant) : null;
    }

    // 删除助手
    public async deleteAssistant(id: number): Promise<void> {
        await SqliteDbCore.deleteData(this.tableName, 'id = ?', [id]);
    }

    // 分页查询助手，支持名称模糊搜索
    public async getAssistantsByPage(page: number, pageSize: number, name?: string): Promise<{list: Assistant[], total: number}> {
        const offset = (page - 1) * pageSize;
        const params: any[] = [pageSize, offset];
        let whereClause = '';
        
        if (name) {
            whereClause = 'WHERE name LIKE ?';
            params.unshift(`%${name}%`);
        }
        
        // 查询列表数据
        const assistants = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY order_number ASC LIMIT ? OFFSET ?`,
            params
        ) as unknown[] || [];
        
        // 查询总记录数
        const [totalResult] = await SqliteDbCore.executeQuery(
            `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`,
            name ? [`%${name}%`] : []
        ) as unknown[] || [];
        
        return {
            list: assistants.map(assistant => assistant as Assistant),
            total: totalResult ? (totalResult as { total: number }).total : 0
        };
    }
}