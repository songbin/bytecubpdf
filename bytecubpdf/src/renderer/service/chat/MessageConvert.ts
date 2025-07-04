import {messageType} from '@/renderer/model/chat/ChatMessage'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {LlmMessageList,LlmMessage,LlmRequestModel,LlmImageMessage} from '@/renderer/llm/model/LlmRequestModel'
import { chatMsgStorageService } from '@/renderer/service/chat/ChatMsgStorageService'
import {chatFileStoreService} from '@/renderer/service/chat/ChatFileStoreService';
import {ChatFileStoreDb} from '@/renderer/model/chat/db/ChatFileStoreDb'
import {ChatRole,FileGroup,AcceptFileType} from '@/renderer/model/chat/ChatConfig'
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager' 
import {ModelFlag} from '@/renderer/model/chat/ChatConfig'
const llmModelManager:LlmModelManager = new LlmModelManager()
/**
 * 把聊天的数据格式转化为大模型提问的数据格式
 * 
*/
export const ChatMsgToLLM = async (messages:BubbleListProps<messageType>['list'], platformId: string, modelId: string): Promise<LlmMessageList> =>{

    const llmMessages = await Promise.all(messages.map( async (message) => {
        const content_prompt:string | LlmImageMessage[] = await buildContentPrompt(message, platformId, modelId)

        
        return {
            role: message.role,
            content: content_prompt || message.content
        }
         
    }))
    // console.log('llmMessages',JSON.stringify(  llmMessages ))
    return LlmMessageList.fromJsonArray(llmMessages)
}
const buildContentPrompt = async (message: messageType,platformId:string, modelId:string): Promise<string | LlmImageMessage[]> => {
    const textContent = message.content as string
    if(ChatRole.USER !== message.role) return textContent
    
    const messageDB = await chatMsgStorageService.getMessageByChatAndMsgId(message.chatId, message.key)
    if(!messageDB?.file_list || messageDB.file_list.length < 4) return textContent
    
    const fileList = await chatFileStoreService.getFileByChatIdAndMsgId(message.chatId, message.key)
    if(fileList.length === 0) return textContent
    
    const {fileCount, imageCount} = countFileTypes(fileList)
    
    const imageContents = fileList
        .filter(doc => FileGroup.IMAGE === doc.file_type)
        .map(doc => ({"url": doc.file_content}))
    
    if(imageCount < 1 || !await checkModelSupportVison(platformId, modelId)) {
        return buildDocumentPrompt(message, fileList, fileCount)
    } else {
        return buildImageMessages(message, imageContents, textContent)
    }
}
//检查模型是否支持视觉
const checkModelSupportVison = async (platformId:string, modelId:string):Promise<boolean> => {
    const model = await llmModelManager.getModel(platformId, modelId)
    //检查model.types里是否包含ModelFlag.VISION
    if(model?.types?.includes(ModelFlag.VISION)) return true
    
    return false
}
const countFileTypes = (fileList: ChatFileStoreDb[]): {fileCount: number, imageCount: number} => {
    let fileCount = 0
    let imageCount = 0
    for (const doc of fileList) {
        if(FileGroup.FILE === doc.file_type) fileCount++
        if(FileGroup.IMAGE === doc.file_type) imageCount++
    }
    return {fileCount, imageCount}
}

const buildDocumentPrompt = (message: messageType, fileList: ChatFileStoreDb[], fileCount: number): string => {
    let prompt = `#### 用户的问题是：\n\`${message.content}\`\n\n`
    prompt += `#### 用户共上传了 \`${fileCount}\` 个文档，分别是：\n\n`
    
    for (const doc of fileList) {
        if(FileGroup.FILE === doc.file_type) {
            prompt += `- **${doc.file_name}：**\n `
            prompt += `  \`文档内容： ${doc.file_content}\`\n\n`
        }
    }
    return prompt
}

const buildImageMessages = (message: messageType, imageContents: any[], textContent: string): LlmImageMessage[] => {
    const targetResult: LlmImageMessage[] = []
    const textTarget = LlmRequestModel.buildImageMessageContent(message.role, textContent, 'text')
    targetResult.push(textTarget)
    
    for (const content of imageContents) {
        const imageTarget = LlmRequestModel.buildImageMessageContent(message.role, content, 'image_url')
        targetResult.push(imageTarget)
    }
    return targetResult
}

