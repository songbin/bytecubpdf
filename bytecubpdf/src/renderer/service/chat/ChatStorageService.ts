import { ChatHistory } from '@/renderer/model/chat/db/ChatHistory';
import { ChatHistoryManager } from '@/renderer/service/manager/chat/ChatHistoryManager';
import { buildId } from '@/shared/utils/StringUtil';
import { ChatModel } from '@/renderer/model/chat/ChatMessage';
const chatHistoryManager = new ChatHistoryManager();
export class ChatStorageService {
    // 创建聊天会话
    async createChatHistory(history: Omit<ChatHistory, 'id'|'create_time'|'update_time'>): Promise<number> {
        return chatHistoryManager.createChatHistory(history);
    }

    // 创建聊天会话
    async createChat(chat_name: string): Promise<ChatModel|null> {
        const chat_id = buildId()
        const chat:ChatHistory = {
            id:0,
            chat_id : chat_id,
            chat_name: chat_name,
            create_time: '',
            update_time: '',
        }
        await chatHistoryManager.createChatHistory(chat);
        const result = await chatHistoryManager.getChatHistoryByChatId(chat_id)
        if(null == result){
            return null
        }
        return {
            id: result.chat_id,
            label: result.chat_name
        }
    }
    // 获取聊天会话分页列表
    async getChatHistoryPage(page = 1, pageSize = 20): Promise<ChatModel[]> {
        const result = await chatHistoryManager.getChatHistoryPage(page, pageSize);
        return result.map(item => {
            return {
                id: item.chat_id,
                label: item.chat_name
            }
        })
    }

    // 获取聊天会话总数
    async getChatHistoryTotalCount(): Promise<number> {
        return chatHistoryManager.getChatHistoryTotalCount();
    }

    // 更新聊天会话
    async updateChatHistoryName(chatId: string, newName: string): Promise<boolean> {
        return chatHistoryManager.updateChatHistoryName(chatId, newName);
    }

    // 删除聊天会话
    async deleteChatHistory(chatId: string): Promise<boolean> {
        return chatHistoryManager.deleteChatHistory(chatId);
    }
}