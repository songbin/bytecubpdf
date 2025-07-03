import {messageType} from '@/renderer/model/chat/ChatMessage'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {LlmMessageList} from '@/renderer/llm/model/LlmRequestModel'
import { chatMsgStorageService } from '@/renderer/service/chat/ChatMsgStorageService'
import { ChatMessageDb } from '@/renderer/model/chat/db/ChatMessageDb';
import {chatFileStoreService} from '@/renderer/service/chat/ChatFileStoreService';
import {ChatFileStoreDb} from '@/renderer/model/chat/db/ChatFileStoreDb'
import {ChatRole} from '@/renderer/model/chat/ChatConfig'
/**
 * 把聊天的数据格式转化为大模型提问的数据格式
 * 
*/
export const ChatMsgToLLM = async (messages:BubbleListProps<messageType>['list']): Promise<LlmMessageList> =>{
    const llmMessages = await Promise.all(messages.map( async (message) => {
        const content_prompt = await buildContentPrompt(message)
        return {
            role: message.role,
            content: content_prompt || message.content
        }
    }))
    return LlmMessageList.fromJsonArray(llmMessages)
}

const buildContentPrompt = async (message:messageType):Promise<string|undefined> => {
    if(ChatRole.USER !== message.role){
        return message.content
    }
    const messageDB:ChatMessageDb|null = await chatMsgStorageService.getMessageByChatAndMsgId(message.chatId, message.key)
    if(null == messageDB){
        return message.content
    }
    if(!messageDB.file_list || messageDB.file_list.length == 0){
        return message.content
    }

    let file_list_array = JSON.parse(messageDB.file_list)
    if(file_list_array.length == 0){
       return message.content
    }

    const fileList:ChatFileStoreDb[] = await chatFileStoreService.getFileByChatIdAndMsgId(message.chatId, message.key)
    console.log('查询到文件内容:', fileList)
    if(fileList.length == 0){
        return message.content
    }
    let prompt = `#### 用户的问题是：\n\`${message.content}\`\n\n`;
    prompt += `#### 用户共上传了 \`${fileList.length}\` 个文档，分别是：\n\n`;

    for (let i = 0; i < fileList.length; i++) {
        const doc = fileList[i];
        prompt += `- **${doc.file_name}：**\n `;
        prompt += `  \`文档内容： ${doc.file_content}\`\n\n`;
        
    }
    return prompt
}