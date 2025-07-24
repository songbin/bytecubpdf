import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';
import { TranslateHistory, TranslateStats } from '@/renderer/model/translate/TranslateHistory';

export class TranslateHistoryManager {
    private readonly tableName = 'translate_history';

    // 在类内部添加字符串安全处理方法
    private sanitizeString(value: any): string {
        return typeof value === 'string' 
            ? value.replace(/'/g, "''") 
            : String(value ?? '');
    }
    //根据id获取实体内容
    async queryHistory(id: number): Promise<TranslateHistory | null> {
        const result = await SqliteDbCore.executeQuery<TranslateHistory>(`
            SELECT * FROM ${this.tableName} WHERE id = ?
        `, [id]);
        return result[0] || null;
    }
    async createHistory(history: Omit<TranslateHistory, 'id'|'createdAt'>): Promise<number> {
        // 对字符串字段统一进行安全处理
        const sanitizedValues = [
            this.sanitizeString(history.sourceFile),
            this.sanitizeString(history.targetFile),
            this.sanitizeString(history.sourceLanguage),
            this.sanitizeString(history.targetLanguage),
            Math.round(history.timeConsumed),
            history.totalPages,
            this.sanitizeString(history.translationEngine),
            this.sanitizeString(history.platformId),
            this.sanitizeString(history.platformName),
            this.sanitizeString(history.modelId),
            this.sanitizeString(history.modelName),
            this.sanitizeString(history.ext1),
            this.sanitizeString(history.ext2),
            this.sanitizeString(history.ext3),
            this.sanitizeString(history.ext4)
        ];

        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(`
            INSERT INTO ${this.tableName} (
                sourceFile, 
                targetFile,
                sourceLanguage,
                targetLanguage,
                timeConsumed,
                totalPages,
                translationEngine,
                platformId,      
                platformName,    
                modelId,        
                modelName,
                ext1,
                ext2,
                ext3,
                ext4      
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, sanitizedValues);
        
        return 0; 
    }

    async getPage(pageno = 1, pageSize = 20, biz = 'pdf'): Promise<TranslateHistory[]> {
        const offset = (Math.max(1, pageno) - 1) * pageSize;
        return SqliteDbCore.executeQuery<TranslateHistory>(`
            SELECT * 
            FROM ${this.tableName} 
            WHERE (ext1 = ? OR (? = 'pdf' AND ext1 = ''))
            ORDER BY createdAt DESC 
            LIMIT ? OFFSET ?
        `, [biz, biz, pageSize, offset]);
    }
    // 获取翻译历史记录的总数
    async getTotalCount(biz = 'pdf'): Promise<number> {
        const result = await SqliteDbCore.executeQuery<{ count: number }>(`
            SELECT COUNT(*) as count
            FROM ${this.tableName}
            WHERE (ext1 = ? OR (? = 'pdf' AND ext1 = ''))
        `, [biz, biz]);
        return result[0]?.count || 0;
    }

    // 按翻译引擎统计
    async getTranslateStats(): Promise<TranslateStats[]> {
        return SqliteDbCore.executeQuery<TranslateStats>(`
            SELECT 
                translationEngine as engine,
                SUM(timeConsumed) as totalTime,
                SUM(totalPages) as totalPages
            FROM ${this.tableName}
            GROUP BY translationEngine
        `);
    }

    // 按ID删除历史记录
    async deleteHistory(id: number): Promise<boolean> {
        const result = await SqliteDbCore.executeQuery<{ changes: number }>(`
            DELETE FROM ${this.tableName}
            WHERE id = ?
        `, [id]);
        
        return result[0]?.changes! > 0;
    }

    // 清空所有历史记录
    async clearAllHistories(): Promise<void> {
        await SqliteDbCore.executeQuery(`DELETE FROM ${this.tableName}`);
    }
}