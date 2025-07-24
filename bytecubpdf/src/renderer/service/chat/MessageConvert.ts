import {messageType} from '@/renderer/model/chat/ChatMessage'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {LlmMessageList,LlmMessage,LlmRequestModel,LlmImageMessage} from '@/renderer/llm/model/LlmRequestModel'
import { chatMsgStorageService } from '@/renderer/service/chat/ChatMsgStorageService'
import {chatFileStoreService} from '@/renderer/service/chat/ChatFileStoreService';
import {ChatFileStoreDb} from '@/renderer/model/chat/db/ChatFileStoreDb'
import {ChatRole,FileGroup,AcceptFileType} from '@/renderer/model/chat/ChatConfig'
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager' 
import {ModelFlag,LLMChatConfig} from '@/renderer/model/chat/ChatConfig'
import { Assistant } from '@/renderer/model/assistant/AssistantDb'
import { assistantService } from '@/renderer/service/AssistantService';
const llmModelManager:LlmModelManager = new LlmModelManager()
/**
 * 把聊天的数据格式转化为大模型提问的数据格式
 * 
*/
export const ChatMsgToLLM = async (messages:BubbleListProps<messageType>['list'], chatConfig:LLMChatConfig): Promise<LlmMessageList> =>{
    if(messages.length == 0){
        throw new Error('messages is empty')
    }
    let resultMessages = null
    let chatId = ''
    if(messages.length > 0){
        chatId = messages[0].chatId
    }
    let chatOnlyFile:boolean = chatConfig.isOnlyFileChat ?? false
    const fileList = await chatFileStoreService.getFilesByChatIdAndFileType(chatId, FileGroup.FILE)
    if(fileList.length < 1){
        chatOnlyFile = false
    }
    if(!chatOnlyFile){
        resultMessages = await buildNormalMessages(messages, chatConfig)
    }else{
        resultMessages = await buildChatFileMessages(messages, chatConfig)
    }
    resultMessages = await rebuildMessagesForSystemAssistant(resultMessages, chatConfig)
    return resultMessages
    
}
const rebuildMessagesForSystemAssistant = async (messages:LlmMessageList, chatConfig:LLMChatConfig): Promise<LlmMessageList> => {
     
    
    //根据chatConfig里的assistantId从数据库取出assistant的配置
    const assistantId:number = Number(chatConfig.assistantId)
    const assistantInfo:Assistant|null = await assistantService.getAssistantById(assistantId)
    console.log('assistantId', assistantId, 'assistantInfo->', JSON.stringify(assistantInfo))
    if(assistantInfo == null){
          return messages
    }
    if(messages.length < 1) {
        messages.push({
            role: ChatRole.SYSTEM,
            content: assistantInfo.prompt_content,
        })
    }
    const firstMessage = messages[0]
    if(firstMessage.role == ChatRole.SYSTEM){
        firstMessage.content = assistantInfo.prompt_content
    }else{
        messages.unshift({
            role: ChatRole.SYSTEM,
            content: assistantInfo.prompt_content,
        })
    }
    console.log(JSON.stringify(messages))
    return messages

}
const buildChatFileMessages = async (messages:BubbleListProps<messageType>['list'], chatConfig:LLMChatConfig): Promise<LlmMessageList> =>{
    //判断messages是空则报错
    if(messages.length < 1) {
        throw new Error('messages is empty')
    }
    let chatId =  ''
    const llmMessages = await Promise.all(messages.map( async (message) => { 
        chatId = message.chatId
        return {
            role: message.role,
            content: message.content
        } 
    }))

    //把最后一个meesage取出来，重新赋值
    const lastContent = llmMessages[llmMessages.length - 1].content
    const newLastContent = await buildChatFilePrompt(chatId, lastContent)
    llmMessages[llmMessages.length - 1].content = newLastContent
    return LlmMessageList.fromJsonArray(llmMessages)
}
 const buildChatFilePrompt = async (chatId: string, query?: string): Promise<string> => {
    const fileList = await chatFileStoreService.getFilesByChatIdAndFileType(chatId, FileGroup.FILE)
    if (fileList.length < 1) {
        return query ?? ''
    }

    // 标记每个文档的编号和名称，并保留原始内容
    const fileContent = fileList
        .map((file, index) => {
            return `### 文档 ${index + 1}: ${file.file_name}\n\n${file.file_content}\n\n---`
        })
        .join('\n')

    const prompt = `你是一个专注于阅读和总结多份文档的语言模型，你的任务是根据以下提供的完整文档内容，回答用户的问题。
        请注意以下几点：
        1. 所有文档内容均已列出，请基于这些内容生成答案，避免引入外部知识。
        2. 尽可能使用原文中的语句进行回答，确保信息准确无误。
        3. 若问题涉及多个文档，请综合所有相关内容进行回答。
        4. 回答需简洁明了，直接回应用户的问题，必要时可用 Markdown 格式排版。
        以下是用户的问题：
        **${query}**
        以下是你要参考的文档内容：
        ${fileContent}
        请根据上述文档内容，返回一个简洁且准确的答案：`
    return prompt
}
const buildNormalMessages = async (messages:BubbleListProps<messageType>['list'], chatConfig:LLMChatConfig): Promise<LlmMessageList> =>{
    const platformId:string = chatConfig.platformId??""
    const modelId:string = chatConfig.modelId??""
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

