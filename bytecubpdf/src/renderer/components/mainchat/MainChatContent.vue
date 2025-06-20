<script setup lang="ts">
import {ref} from 'vue'
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import { BubbleList, MentionSender } from 'vue-element-plus-x'
import aiAvatar from '@/renderer/assets/avatars/ai-avatar.png'
import userAvatar from '@/renderer/assets/avatars/user-avatar.png'
import { NFlex, NButton, NIcon } from 'naive-ui'
import { Delete, CopyFile, Edit,SendAlt } from '@vicons/carbon'
import { Refresh,Attach,Add } from '@vicons/ionicons5';
import { BrainCircuit20Regular } from '@vicons/fluent';
type listType = BubbleListItemProps & {
  key: number
  role: 'user' | 'ai'
}
const senderValue = ref('')
const isSelect = ref(false)
// 示例调用
const list: BubbleListProps<listType>['list'] = generateFakeItems(5)

function generateFakeItems(count: number): listType[] {
  const messages: listType[] = []
  for (let i = 0; i < count; i++) {
    const role = i % 2 === 0 ? 'ai' : 'user'
    const placement = role === 'ai' ? 'start' : 'end'
    const key = i + 1
    const content = role === 'ai'
      ? '用小书芽以后你可以直接使用国外的模型了,去OpenRouter申请个密钥，什么openai、Gemini都可以在小书芽使用了\n'.repeat(5)
      : `哈哈哈，让我试试`
    const loading = false
    const shape = 'corner'
    const variant = role === 'ai' ? 'filled' : 'outlined'
    const isMarkdown = false
    const typing = role === 'ai' ? i === count - 1 : false

    const avatar = role === 'ai' ? aiAvatar : userAvatar

    messages.push({
      key, // 唯一标识
      role, // user | ai 自行更据模型定义
      placement, // start | end 气泡位置
      content, // 消息内容 流式接受的时候，只需要改这个值即可
      loading, // 当前气泡的加载状态
      shape, // 气泡的形状
      variant, // 气泡的样式
      isMarkdown, // 是否渲染为 markdown
      typing, // 是否开启打字器效果 该属性不会和流式接受冲突
      isFog: role === 'ai', // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
      avatar,
      avatarSize: '24px', // 头像占位大小
      avatarGap: '12px', // 头像与气泡之间的距离
    })
  }
  return messages
}
</script>

<template>
  <n-flex vertical>
    <div style="height: calc(100vh - 300px);">
      <BubbleList :list="list" max-height="100%">
        <!-- 自定义头部 -->
        <template #header="{ item }">
          <div class="header-wrapper">
            <div class="header-name">
              {{ item.role === 'ai' ? '小书芽' : '用户' }}
            </div>
          </div>
        </template>
        <template #footer>
          <n-flex>
            <n-button tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <Edit />
                </n-icon>
              </template>
            </n-button>
            <n-button tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <Refresh />
                </n-icon>
              </template>
            </n-button>
            <n-button tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <CopyFile />
                </n-icon>
              </template>
            </n-button>
            <n-button tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <Delete />
                </n-icon>
              </template>
            </n-button>

          </n-flex>
        </template>
      </BubbleList>
    </div>


    <div style="display: flex; flex-direction: column; gap: 5px;">
      <n-flex>
          <n-button size="tiny">
            PDF翻译
          </n-button>
           <n-button size="tiny">
            图片OCR
          </n-button>
      </n-flex>
      <MentionSender  v-model="senderValue" variant="updown" :auto-size="{ minRows: 2, maxRows: 4 }" clearable
        allow-speech placeholder="Enter=发送, SHIFT + ENTER = 换行">
        <template #prefix>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <n-button size="small" tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <Add />
                </n-icon>
              </template>
            </n-button>

            

            
          </div>
        </template>

        <template #action-list>
          <div style="display: flex; align-items: center; gap: 8px;">
             <n-button size="small" tertiary circle type="primary">
              <template #icon>
                <n-icon>
                  <SendAlt />
                </n-icon>
              </template>
              </n-button>
          </div>
        </template>
      </MentionSender>
    </div>
  </n-flex>
</template>

<style scoped>
.isSelect {
  color: #626aef;
  border: 1px solid #626aef !important;
  border-radius: 15px;
  padding: 3px 12px;
  font-weight: 700;
}
</style>