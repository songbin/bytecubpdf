/**
 * 文件存储服务 - 业务逻辑层
 * 封装数据库操作，处理业务规则和错误处理
 */
import { chatFileStoreManager } from '@/renderer/service/manager/chat/ChatFileStoreManager';
import { ChatFileStoreDb } from '@/renderer/model/chat/db/ChatFileStoreDb';

export class ChatFileStoreService {
    private static instance: ChatFileStoreService;

    private constructor() {}

    public static getInstance(): ChatFileStoreService {
        if (!ChatFileStoreService.instance) {
            ChatFileStoreService.instance = new ChatFileStoreService();
        }
        return ChatFileStoreService.instance;
    }

    async addFile(file: ChatFileStoreDb): Promise<number> {
        try {
            return await chatFileStoreManager.addFile(file);
        } catch (error) {
            console.error('添加文件失败:', error);
            throw new Error('添加文件时发生错误');
        }
    }


    async getFilesByChatId(chatId: string): Promise<ChatFileStoreDb[]> {
        try {
            return await chatFileStoreManager.getFilesByChatId(chatId);
        } catch (error) {
            console.error('获取聊天文件失败:', error);
            throw new Error('获取聊天文件时发生错误');
        }
    }

    async getFilesByMsgId(msgId: string): Promise<ChatFileStoreDb[]> {
        try {
            return await chatFileStoreManager.getFilesByMsgId(msgId);
        } catch (error) {
            console.error('获取消息文件失败:', error);
            throw new Error('获取消息文件时发生错误');
        }
    }

    async updateFile(chatId: string, msgId:string, file: Partial<ChatFileStoreDb>): Promise<boolean> {
        try {
            return await chatFileStoreManager.updateFileByChatAndMsg(chatId, msgId, file);
        } catch (error) {
            console.error('更新文件失败:', error);
            throw new Error('更新文件时发生错误');
        }
    }

    async deleteFile(chatId: string, msgId:string, ): Promise<boolean> {
        try {
            return await chatFileStoreManager.deleteFilesByChatAndMsg(chatId, msgId);
        } catch (error) {
            console.error('删除文件失败:', error);
            throw new Error('删除文件时发生错误');
        }
    }

    async deleteFilesByChatAndMsg(chatId: string, msgId: string): Promise<boolean> {
        try {
            return await chatFileStoreManager.deleteFilesByChatAndMsg(chatId, msgId);
        } catch (error) {
            console.error('删除聊天消息文件失败:', error);
            throw new Error('删除聊天消息文件时发生错误');
        }
    }

    async getFileByMd5(md5: string): Promise<ChatFileStoreDb[]> {
        try {
            return await chatFileStoreManager.getFileByMd5(md5);
        } catch (error) {
            console.error('获取MD5文件失败:', error);
            throw new Error('获取MD5文件时发生错误');
        }
    }
}

export const chatFileStoreService = ChatFileStoreService.getInstance();
