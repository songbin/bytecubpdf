import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations'
export type messageType = BubbleListItemProps & {
  key: string;
  role: 'system' | 'user' | 'assistant';
  thinkingStatus?: ThinkingStatus;
  thinlCollapse?: boolean;
  nowTime:string;
  chatId:string;
  fileMd5?:string;
  fileName?:string;
}

export type ChatModel = ConversationItem & {

}
