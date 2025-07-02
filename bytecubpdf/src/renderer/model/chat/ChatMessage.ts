import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations'
import type { FilesCardProps } from 'vue-element-plus-x/types/FilesCard';
export type messageType = BubbleListItemProps & {
  key: string;
  role: 'system' | 'user' | 'assistant';
  thinkingStatus?: ThinkingStatus;
  thinlCollapse?: boolean;
  nowTime:string;
  chatId:string;
  fileList?:string;
}
export type FilesList = FilesCardProps & {
  file: File;
};
export type ChatModel = ConversationItem & {

}
