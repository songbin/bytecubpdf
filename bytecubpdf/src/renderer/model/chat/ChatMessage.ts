import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
import type { ConversationItem } from 'vue-element-plus-x/types/Conversations'
import type { FilesCardProps } from 'vue-element-plus-x/types/FilesCard';
export type messageType = BubbleListItemProps & {
  key: string;
  role: string;
  thinkingStatus?: ThinkingStatus;
  thinlCollapse?: boolean;
  nowTime:string;
  chatId:string;
  fileList?:string;
  reasoning_content?: string;
  maxWidth?:string;
}
export type FilesList = FilesCardProps & {
  file: File;
};
export type ChatModel = ConversationItem & {

}
