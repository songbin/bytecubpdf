import { translateTermManager } from '@/renderer/service/manager/TranslateTermManager';
export class TermsService {
    constructor() { }
/**
 * 获取所有术语并将其存储在一个普通对象中。
 * 
 * 此方法调用 `translateTermManager` 的 `paging` 方法，获取第一页且每页包含 1000 条记录的数据，
 * 然后将返回的术语数据组装成一个普通对象，键为源术语，值为翻译后的术语。
 * 
 * @returns {Promise<Object>} 一个包含所有术语的普通对象，键是源术语，值是翻译后的术语。
 */
    async getTerms():Promise<Object> {
        const termsResponse = await translateTermManager.paging({ 
            page: 1,
            pageSize: 1000 // 获取全部术语
          });
        // 将Map转换为普通对象
        const termPromptObj: Record<string, string> = {};
        termsResponse.items.forEach(item => {
            if (item.sourceTerm && item.translatedTerm) {
                termPromptObj[item.sourceTerm] = item.translatedTerm;
            }
        });
        
        return termPromptObj;
    }
}

export const termsService = new TermsService();