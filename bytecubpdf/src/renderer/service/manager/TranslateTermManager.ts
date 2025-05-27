import SqliteDbCore from '@/renderer/service/core/SqliteDbCore';
import { PagingParams, PagingResponse, Term } from '@/renderer/model/terms/terms';

export class TranslateTermManager {
    private readonly tableName = 'translate_terms';

    async create(term: Omit<Term, 'id' | 'created_at' | 'updated_at'>) {
        const insertData: Term = {
            ...term,
            id: 0, // placeholder
            ext1: term.ext1 || '',
            ext2: term.ext2 || '',
            ext3: term.ext3 || '',
            ext4: term.ext4 || '',
            ext5: term.ext5 || '',
            ext6: term.ext6 || '',
            ext7: term.ext7 || '',
            ext8: term.ext8 || ''
        };
        
        const result = await SqliteDbCore.executeQuery<{ lastInsertRowid: number }>(`
            INSERT INTO ${this.tableName} 
            (sourceTerm, translatedTerm, ext1, ext2, ext3, ext4, ext5, ext6, ext7, ext8)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            insertData.sourceTerm,
            insertData.translatedTerm,
            insertData.ext1,
            insertData.ext2,
            insertData.ext3,
            insertData.ext4,
            insertData.ext5,
            insertData.ext6,
            insertData.ext7,
            insertData.ext8
        ]);
        
        return 0;
    }

    async update(id: number, updates: Partial<Omit<Term, 'id' | 'createdAt'>>) {
        await SqliteDbCore.executeQuery(
            `UPDATE ${this.tableName} SET 
                sourceTerm = COALESCE(?, sourceTerm),
                translatedTerm = COALESCE(?, translatedTerm),
                ext1 = COALESCE(?, ext1),
                ext2 = COALESCE(?, ext2),
                ext3 = COALESCE(?, ext3),
                ext4 = COALESCE(?, ext4),
                ext5 = COALESCE(?, ext5),
                ext6 = COALESCE(?, ext6),
                ext7 = COALESCE(?, ext7),
                ext8 = COALESCE(?, ext8)
            WHERE id = ?`,
            [
                updates.sourceTerm,
                updates.translatedTerm,
                // 以下参数应保持与SQL语句中COALESCE顺序一致
                updates.ext1,
                updates.ext2,
                updates.ext3,
                updates.ext4,
                updates.ext5,
                updates.ext6,
                updates.ext7,
                updates.ext8,
                id
            ]
        );
        return this.getById(id);
    }

    async delete(id: number) {
        await SqliteDbCore.deleteData(this.tableName, 'id = ?', [id]);
    }

    async paging(params: PagingParams): Promise<PagingResponse<Term>> {
        const { page = 1, pageSize = 10, keyword } = params;
        const offset = (page - 1) * pageSize;

        let whereClause = '';
        const queryParams: any[] = [];
        if (keyword) {
            whereClause = 'WHERE sourceTerm LIKE ? OR translatedTerm LIKE ?';
            queryParams.push(`%${keyword}%`, `%${keyword}%`);
        }

        const totalResult = await SqliteDbCore.executeQuery<{ total: number }>(
            `SELECT COUNT(id) AS total FROM ${this.tableName} ${whereClause}`,
            queryParams
        ).then(res => res[0]);

        const items = await SqliteDbCore.executeQuery<Term>(
            `SELECT * FROM ${this.tableName} 
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?`,
            [...queryParams, pageSize, offset]
        );

        return {
            items: Array.isArray(items) ? items : [items], // 确保返回的是数组
            total: totalResult?.total || 0
        };
    }

    async getById(id: number): Promise<Term | undefined> {
        const result = await SqliteDbCore.executeQuery<Term>(
            `SELECT * FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result[0]; // 明确取第一条记录
    }

    async batchUpdate(terms: Term[]) {
        try {
            await SqliteDbCore.beginTransaction();
            
            for (const term of terms) {
                if (term.id > 0) {
                    await this.update(term.id, term);
                } else {
                    await this.create(term);
                }
            }
            
            await SqliteDbCore.commit();
        } catch (error) {
            await SqliteDbCore.rollback();
            throw error;
        }
    }
}

export const translateTermManager = new TranslateTermManager();