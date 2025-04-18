
import { SettingLLMModel, SettingLLMPlatform } from '@/renderer/model/settings/SettingLLM';
import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';

export class LlmModelManager {
    private readonly platformTable = 'llm_platforms';
    private readonly modelTable = 'llm_models';

    // 添加或更新平台
    public async savePlatform(platform: Omit<SettingLLMPlatform, 'models'>): Promise<void> {
        const platformId = platform.id || crypto.randomUUID().replace(/-/g, '');
        await SqliteDbCore.executeQuery(`
            INSERT OR REPLACE INTO ${this.platformTable} 
            (id, platformName, protocolType, apiKey, apiUrl, isActive)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            platformId, 
            platform.platformName, 
            platform.protocolType, 
            platform.apiKey, 
            platform.apiUrl,
            platform.isActive ?? true  // 默认值为true
        ]);
    }

    // 获取平台下的所有模型
    public async getModelsByPlatform(platformId: string): Promise<SettingLLMModel[]> {
        const models = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.modelTable} WHERE platformId = ?`,
            [platformId]
        ) as unknown[] || [];
        
        return models.map(model => ({
            ...(model as Omit<SettingLLMModel, 'types'> & { types: string }),
            types: JSON.parse((model as any).types) as Array<'text' | 'vision' | 'embedded' | 'multi'>
        }));
    }

    // 获取所有平台
    public async getPlatforms(): Promise<SettingLLMPlatform[]> {
        const platforms = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.platformTable} ORDER BY createdAt DESC`
        ) as unknown[] || [];
        
        return Promise.all(platforms.map(async (platform) => {
            const models = await this.getModelsByPlatform((platform as any).id);
            return { ...(platform as Omit<SettingLLMPlatform, 'models'>), models };
        }));
    }

    // 获取单个平台
    public async getPlatform(id: string): Promise<SettingLLMPlatform | null> {
        const [platform] = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.platformTable} WHERE id = ?`,
            [id]
        ) as unknown[] || [];
        
        if (!platform) return null;
        
        const models = await this.getModelsByPlatform(id);
        return { ...(platform as Omit<SettingLLMPlatform, 'models'>), models };
    }

      // 获取单个平台基本信息（不包含模型）
      public async getPlatformBasicInfo(id: string): Promise<Omit<SettingLLMPlatform, 'models'> | null> {
        const [platform] = await SqliteDbCore.executeQuery(
            `SELECT * FROM ${this.platformTable} WHERE id = ?`,
            [id]
        ) as unknown[] || [];
        
        return platform ? (platform as Omit<SettingLLMPlatform, 'models'>) : null;
    } 

    // 添加或更新模型
    public async saveModel(platformId: string, model: SettingLLMModel): Promise<void> {
        await SqliteDbCore.insertData(this.modelTable, {
            id: model.id,
            platformId,
            name: model.name,
            types: JSON.stringify(model.types)
        });
    }

    // 获取单个模型
    public async getModel(id: string): Promise<SettingLLMModel | null> {
        const [model] = await SqliteDbCore.executeQuery<{
            id: string;
            platformId: string;
            name: string;
            types: string;
        }>(
            `SELECT * FROM ${this.modelTable} WHERE id = ?`, 
            [id]
        ) || [];
        
        if (!model) return null;
        
        return {
            ...model,
            types: JSON.parse(model.types)
        };
    }

    // 删除平台及其关联模型
    public async deletePlatform(id: string): Promise<void> {
        await SqliteDbCore.beginTransaction();
        try {
            // 修改为符合SqliteDbCore的调用方式
            await SqliteDbCore.deleteData(this.modelTable, 'platformId = ?', [id]);
            await SqliteDbCore.deleteData(this.platformTable, 'id = ?', [id]);
            await SqliteDbCore.commit();
        } catch (error) {
            await SqliteDbCore.rollback();
            throw error;
        }
    }

    // 删除模型
    public async deleteModel(id: string): Promise<void> {
        if (!id?.trim()) return;

        try {
            // 静默处理不存在的情况
            const existing = await this.getModel(id);
            if (!existing) return;

            // 执行静默删除（不检查删除结果）
            await SqliteDbCore.deleteData(this.modelTable, 'id = ?', [id]);
        } catch (error) {
            // 静默处理所有错误
            console.error('删除模型时发生静默错误:', error);
        }
    }

    // 关闭数据库连接
    public async close(): Promise<void> {
        await SqliteDbCore.close();
    }

    // 新增方法：使用事务同时保存平台和模型
    public async savePlatformWithModels(platform: SettingLLMPlatform): Promise<void> {
        await SqliteDbCore.beginTransaction();
        try {
            // 保存平台信息
            await this.savePlatform(platform);
            
            // 先删除该平台下所有旧模型
            await SqliteDbCore.deleteData(this.modelTable, 'platformId = ?', [platform.id]);
            
            // 保存所有新模型
            for (const model of platform.models) {
                await this.saveModel(platform.id, model);
            }
            
            await SqliteDbCore.commit();
        } catch (error) {
            await SqliteDbCore.rollback();
            throw error;
        }
    }
}