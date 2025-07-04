import {messageType} from '@/renderer/model/chat/ChatMessage'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {LlmMessageList,LlmMessage,LlmRequestModel,LlmImageMessage} from '@/renderer/llm/model/LlmRequestModel'
import { chatMsgStorageService } from '@/renderer/service/chat/ChatMsgStorageService'
import { ChatMessageDb } from '@/renderer/model/chat/db/ChatMessageDb';
import {chatFileStoreService} from '@/renderer/service/chat/ChatFileStoreService';
import {ChatFileStoreDb} from '@/renderer/model/chat/db/ChatFileStoreDb'
import {ChatRole,FileGroup,AcceptFileType} from '@/renderer/model/chat/ChatConfig'
import {FileUtil} from '@/renderer/utils/FileUtil'
/**
 * 把聊天的数据格式转化为大模型提问的数据格式
 * 
*/
export const ChatMsgToLLM = async (messages:BubbleListProps<messageType>['list']): Promise<LlmMessageList> =>{
    const llmMessages = await Promise.all(messages.map( async (message) => {
        const content_prompt:string | LlmImageMessage[] = await buildContentPrompt(message)
        
        return {
            role: message.role,
            content: content_prompt || message.content
        }
         
    }))
    // console.log('llmMessages',JSON.stringify(  llmMessages ))
    return LlmMessageList.fromJsonArray(llmMessages)
}

const buildContentPrompt = async (message:messageType):Promise<string | LlmImageMessage[]> => {
    const textContent = message.content as string
    if(ChatRole.USER !== message.role){
        return textContent
    }
    const messageDB:ChatMessageDb|null = await chatMsgStorageService.getMessageByChatAndMsgId(message.chatId, message.key)
    if(null == messageDB){
        return textContent
    }
    if(!messageDB.file_list || messageDB.file_list.length == 0){
        return textContent
    }

    let file_list_array = JSON.parse(messageDB.file_list)
    if(file_list_array.length == 0){
       return textContent
    }

    const fileList:ChatFileStoreDb[] = await chatFileStoreService.getFileByChatIdAndMsgId(message.chatId, message.key)

    if(fileList.length == 0){
        return textContent
    }

    //根据fileList里每个item的值，计算上传了几个文档，当item.tile_type==FileGroup.FILE的时候是文档，当item.tile_type==FileGroup.IMAGE的时候是图片
    let fileCount = 0
    let imageCount = 0
    for (let i = 0; i < fileList.length; i++) {
        const doc = fileList[i];
        if(FileGroup.FILE == doc.file_type){
            fileCount++
        }
        if(FileGroup.IMAGE == doc.file_type){
            imageCount++
        }
    }
    let image_base64:any[] = []
    let prompt = `#### 用户的问题是：\n\`${message.content}\`\n\n`;
    prompt += `#### 用户共上传了 \`${fileCount}\` 个文档，分别是：\n\n`;
     for (let i = 0; i < fileList.length; i++) {
        const doc = fileList[i];
        if(FileGroup.FILE == fileList[i].file_type){
            prompt += `- **${doc.file_name}：**\n `;
            prompt += `  \`文档内容： ${doc.file_content}\`\n\n`;
            
        }else if(FileGroup.IMAGE == fileList[i].file_type){
            const content = {"url": doc.file_content}
            image_base64.push(content)
        }
    }
    let targetResult:LlmImageMessage[] = []
   
    if(imageCount < 1){
        return prompt
    }else{
        const textTarget:LlmImageMessage = LlmRequestModel.buildImageMessageContent(message.role, textContent, 'text')
        targetResult.push(textTarget)
        for(let i = 0; i < image_base64.length; i++){
            const imageTarget:LlmImageMessage = LlmRequestModel.buildImageMessageContent(message.role, image_base64[i], 'image_url')
            targetResult.push(imageTarget)
        }
    }
    
    return targetResult
}