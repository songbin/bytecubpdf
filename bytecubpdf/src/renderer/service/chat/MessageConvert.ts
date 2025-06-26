import {messageType} from '@/renderer/model/chat/ChatMessage'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import {LlmMessageList} from '@/renderer/llm/model/LlmRequestModel'
/**
 * 把聊天的数据格式转化为大模型提问的数据格式
 * 
*/
export const ChatMsgToLLM = (messages:BubbleListProps<messageType>['list']):LlmMessageList =>{
    const llmMessages = messages.map(message => {
        return {
            role: message.role,
            content: message.content
        }
    })
    return LlmMessageList.fromJsonArray(llmMessages)
}