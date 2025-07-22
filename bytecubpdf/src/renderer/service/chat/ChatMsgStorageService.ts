import { ChatMessageManager } from '@/renderer/service/manager/chat/ChatMessageManager';
import { ChatMessageDb } from '@/renderer/model/chat/db/ChatMessageDb';
import { messageType,FilesList } from '@/renderer/model/chat/ChatMessage'
import {chatFileStoreService} from '@/renderer/service/chat/ChatFileStoreService';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {FileReaderUtil} from '@/renderer/utils/FileReaderUtil';
import { FileUtil } from '@/renderer/utils/FileUtil';
import {ChatFileStoreDb} from '@/renderer/model/chat/db/ChatFileStoreDb';
import {ChatRole,FileGroup,AcceptFileType} from '@/renderer/model/chat/ChatConfig'
/**
 * 聊天消息存储服务 - 业务逻辑层
 * 封装数据库操作，处理业务规则和错误处理
 */
export class ChatMsgStorageService {
  private static instance: ChatMsgStorageService;
  private messageManager: ChatMessageManager;

  private constructor() {
    this.messageManager = new ChatMessageManager();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ChatMsgStorageService {
    if (!ChatMsgStorageService.instance) {
      ChatMsgStorageService.instance = new ChatMsgStorageService();
    }
    return ChatMsgStorageService.instance;
  }

  /**
   * 保存聊天消息
   * @param message 消息对象（不含id和时间戳）
   * @returns 新创建消息的ID
   */
  async saveMessage(message: messageType, fileList:FilesList[]): Promise<number> {
    if (!message.chatId || !message.key) {
      throw new Error('聊天ID和消息Key不能为空');
    }
    let fileNameListStr = '[]'
    if(fileList){
      fileNameListStr = fileList.length > 0 ? JSON.stringify(fileList.map(item => item.file.name)):'[]';
    }
    
    try {
      const content:string = message.content ? message.content : '';
      const msgDb: ChatMessageDb = {
        id: 0,
        chat_id: message.chatId,
        msg_id: message.key,
        role: message.role,
        content: content,
        file_list: fileNameListStr,
        reasoning_content: message.reasoning_content,
        nowTime: message.nowTime,
        create_time: message.nowTime,
        update_time: message.nowTime,
      }
      await this.saveFileStore(message.chatId, message.key, fileList);
      return await this.messageManager.createMessage(msgDb);
    } catch (error) {
      console.error('保存聊天消息失败:', error);
      throw new Error(`消息存储失败: ${(error as Error).message}`);
    }
  }
  async saveFileStore(chatId:string, msgId:string, fileList:FilesList[]){
    await Promise.all(fileList.map(async item => {
      const fileName = item.file.name;
      const fileMd5 = await FileUtil.getFileMd5(item.file);
      const fileExist = await chatFileStoreService.checkFileExist(chatId, fileMd5);
      
      if(!fileExist){
        let text = ''
        const fileGroup = AcceptFileType.groupTypeByFileName(fileName)
        if(fileGroup === FileGroup.IMAGE){
          text = await FileUtil.getFileBase64(item.file);
        }else{
          text = await FileReaderUtil.parseFile(item.file);
        }
        const fileType = AcceptFileType.groupTypeByFileName(fileName)
        const fileStoreDb:ChatFileStoreDb = {
          id: 0,
          file_name: fileName,
          file_md5: fileMd5,
          file_content: text,
          file_type: fileType,
          file_extent: fileName.substring(fileName.lastIndexOf('.') + 1),
          file_size: item.file.size,
          msg_id: msgId,
          chat_id: chatId,
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        };
        await chatFileStoreService.addFile(fileStoreDb);
      }
    }));
  }
  /**
   * 获取指定会话的消息列表
   * @param chatId 会话ID
   * @returns 按时间排序的消息列表
   */
  async getMessagesByChatId(chatId: string): Promise<BubbleListProps<messageType>['list']> {
    if (!chatId) {
      throw new Error('会话ID不能为空');
    }

    try {
      const result =  await this.messageManager.getMessagesByChatId(chatId);
      return result.map(item => {
        const placement: messageType['placement'] = item.role === ChatRole.USER ? 'end' : 'start'
        return {
            key: item.msg_id,
            content: item.content,
            fileList: item.file_list,
            chatId: item.chat_id,
            reasoning_content: item.reasoning_content,
            nowTime: item.nowTime,
            thinkingStatus: 'end',
            thinlCollapse: false,
            role: item.role,
            create_time: item.create_time,
            update_time: item.update_time,
            placement,
            isMarkdown: true,
            maxWidth:'80%'
        }
      })
    } catch (error) {
      console.error(`获取会话[${chatId}]消息失败:`, error);
      throw new Error(`获取消息失败: ${(error as Error).message}`);
    }
  }
  async getMessageByChatAndMsgId(chatId: string, msgId:string): Promise<ChatMessageDb|null>{
    if (!chatId || !msgId) {
      throw new Error('会话ID和消息Key不能为空');
    }
    const result = await this.messageManager.getMessageByChatIdAndMsgId(chatId, msgId);
    if(!result){
      return null;
    }

    return result
  }
  /**
   * 批量删除指定会话中的多个消息
   * @param chatId 会话ID
   * @param keys 消息唯一标识数组
   * @returns 是否全部删除成功
   */
  async deleteMessagesByKeys(chatId: string, keys: string[]): Promise<boolean> {
    if (!chatId) {
      throw new Error('会话ID不能为空');
    }
    if (!keys || keys.length === 0) {
      return true
    }

    try {
      await chatFileStoreService.deleteFileByChatAndMsgIds(chatId, keys);
      return await this.messageManager.deleteMessagesByChatIdAndKeys(chatId, keys);
    } catch (error) {
      console.error(`批量删除会话[${chatId}]中的消息失败:`, error);
      throw new Error(`批量删除消息失败: ${(error as Error).message}`);
    }
  }
  /**
   * 更新消息内容
   * @param chatId 会话ID
   * @param key 消息唯一标识
   * @param newContent 新内容
   * @returns 是否更新成功
   */
  async updateMessageContent(chatId: string, key: string, newContent: string): Promise<boolean> {
    if (!chatId || !key) {
      throw new Error('会话ID和消息Key不能为空');
    }
    if (!newContent) {
      throw new Error('消息内容不能为空');
    }

    try {
      return await this.messageManager.updateMessageByChatIdAndKey(chatId, key, newContent);
    } catch (error) {
      console.error(`更新消息[${chatId}-${key}]失败:`, error);
      throw new Error(`更新消息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 删除指定消息
   * @param chatId 会话ID
   * @param key 消息唯一标识
   * @returns 是否删除成功
   */
  async deleteMessage(chatId: string, key: string): Promise<boolean> {
    if (!chatId || !key) {
      throw new Error('会话ID和消息Key不能为空');
    }

    try {
      await chatFileStoreService.deleteFilesByChatAndMsg(chatId, key);
      return await this.messageManager.deleteMessageByChatIdAndKey(chatId, key);
    } catch (error) {
      console.error(`删除消息[${chatId}-${key}]失败:`, error);
      throw new Error(`删除消息失败: ${(error as Error).message}`);
    }
  }

  /**
   * 清空会话所有消息
   * @param chatId 会话ID
   * @returns 是否清空成功
   */
  async clearChatMessages(chatId: string): Promise<boolean> {
    if (!chatId) {
      throw new Error('会话ID不能为空');
    }
    try {
      return await this.messageManager.clearMessagesByChatId(chatId);
    } catch (error) {
      console.error(`清空会话[${chatId}]消息失败:`, error);
      throw new Error(`清空消息失败: ${(error as Error).message}`);
    }
  }
}

// 导出单例实例
export const chatMsgStorageService = ChatMsgStorageService.getInstance();