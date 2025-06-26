import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
export type messageType = BubbleListItemProps & {
  key: string;
  role: 'system' | 'user' | 'assistant';
  thinkingStatus?: ThinkingStatus;
  thinlCollapse?: boolean;
}