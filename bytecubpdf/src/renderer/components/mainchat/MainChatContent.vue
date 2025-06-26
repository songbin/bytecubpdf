<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import { BubbleList, MentionSender, Thinking } from 'vue-element-plus-x'
import aiAvatar from '@/renderer/assets/avatars/ai-avatar.png'
import userAvatar from '@/renderer/assets/avatars/user-avatar.png'
import { NFlex, NButton, NIcon, NSelect, NTag, NTooltip, NButtonGroup, useMessage, NModal, NCard } from 'naive-ui'
import { Delete, CopyFile, Edit, SendAlt, Temperature } from '@vicons/carbon'
import { Refresh, Attach, Add, TrainOutline as TrainIcon } from '@vicons/ionicons5';
import { BrainCircuit20Regular } from '@vicons/fluent';
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager';
import MainChatIndexDb from '@/renderer/service/indexdb/MainChatIndexDb';
import { ChatService } from '@/renderer/service/chat/ChatService';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import { v4 as uuidv4 } from 'uuid';
import { messageType } from '@/renderer/model/chat/ChatMessage'
import { ChatMsgToLLM } from '@/renderer/service/chat/MessageConvert'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
const chatService = new ChatService()
const message = useMessage()
const llmManager = new LlmModelManager();
const mainChatIndexDb = new MainChatIndexDb();
const formData = ref({
  platformId: '',
  platformName: '',
  modelId: '',
  modelName: '',
})
const platforms = ref<Array<{ value: string; label: string }>>([]);
const models = ref<Array<{ value: string; label: string }>>([]);

const senderValue = ref('')

// 示例调用
const messages = ref<BubbleListProps<messageType>['list']>([]);
const handlePlatformChange = async (platformId: string) => {
  const modelList = await llmManager.getModelsByPlatform(platformId);
  formData.value.platformName = platforms.value.find((p) => p.value == platformId)?.label || '';
  models.value = modelList.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  if (modelList.length > 0) {
    formData.value.modelId = modelList[0].id;
    formData.value.modelName = modelList[0].name;
  } else {
    formData.value.modelId = '';
    formData.value.modelName = ''
  }
};
const handleThinkingChange = (payload: { value: boolean; status: ThinkingStatus }) => {
  // console.log('value', payload.value, 'status', payload.status);
}
const renderLabel = (option: { label: string }) => {
  return option.label;
}
const showSelectModel = ref(false)

const handleShowSelectModel = () => {
  showSelectModel.value = true;
}

const handleSendMessage = async () => {
  console.log(senderValue.value)
  const platformInfo = await llmManager.getPlatformBasicInfo(formData.value.platformId)
  if (!platformInfo) {
    message.error('平台非法')
    return
  }
  if (!platformInfo.apiKey) {
    message.error('请配置密钥')
    return
  }
  const role = 'user'
  const content = senderValue.value
  const messageUserItem = buildMessageItem(role, content)

  messages.value.push(messageUserItem)
  senderValue.value = ''
  askSSE()

}
const askSSE = async () => {
  try {
    const stream = chatService.stream(formData.value.platformId,
      formData.value.modelId,
      0.7,
      4096,
      ChatMsgToLLM(messages.value))

    const messageAssistantItem = buildMessageItem('assistant', '')
    messages.value.push(messageAssistantItem)
    for await (const chunk of stream) {
      const message = LlmResModel.fromObject(chunk)
      messages.value[messages.value.length - 1].content += message?.getContent() || '';
      messages.value[messages.value.length - 1].reasoning_content += message?.getReasoningContent() || ''
      messages.value[messages.value.length - 1].thinkingStatus = parseThinkStatus()
      await nextTick();
    }
  } catch (error) {
    const error_msg = '请求大模型平台失败' + (error as Error).message
    message.error(error_msg)
  }

}
const parseThinkStatus = () => {
  const thinkingContent: string | undefined = messages.value[messages.value.length - 1].reasoning_content
  const content: string | undefined = messages.value[messages.value.length - 1].content;
  if (thinkingContent && !content) {
    return 'thinking'
  } else if (content) {
    return 'end'
  }

  return 'thinking'
}

const buildMessageItem = (role: 'system' | 'user' | 'assistant', content: string) => {
  const placement: messageType['placement'] = role === 'user' ? 'end' : 'start'
  const loading = false
  const shape: messageType['shape'] = 'corner'
  const variant: messageType['variant'] = role === 'system' ? 'filled' : 'outlined'
  const isMarkdown = true
  const typing = role === 'assistant' ? true : false
  const isFog = role === 'assistant' ? true : false
  const avatar = role === 'user' ? userAvatar : aiAvatar
  const key = uuidv4();
  const reasoning_content = ''//?: string

  return {
    key, // 唯一标识
    role, // user | ai 自行更据模型定义
    placement, // start | end 气泡位置
    content, // 消息内容 流式接受的时候，只需要改这个值即可
    reasoning_content,
    loading, // 当前气泡的加载状态
    shape, // 气泡的形状
    variant, // 气泡的样式
    isMarkdown, // 是否渲染为 markdown
    typing, // 是否开启打字器效果 该属性不会和流式接受冲突
    isFog, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
    avatar,
    avatarSize: '24px', // 头像占位大小
    avatarGap: '12px', // 头像与气泡之间的距离
  }
}
onMounted(async () => {
  try {
    await mainChatIndexDb;
    const config = await mainChatIndexDb.getConfig();
    if (config) {
      formData.value = {
        platformId: config.platformId || '',
        modelId: config.modelId || '',
        platformName: config.platformName || '',
        modelName: config.modelName || '',
      };
      if (config.platformId) {
        await handlePlatformChange(config.platformId);
      }
    }
    const platformList = await llmManager.getPlatforms();
    platforms.value = platformList.map((p) => ({
      value: p.id,
      label: p.platformName,
    }));
    if (formData.value.platformId == '') {
      formData.value.platformId = platforms.value[0].value;
      handlePlatformChange(formData.value.platformId);
    }

    handlePlatformChange(formData.value.platformId);

  } catch (error) {
    console.error('加载配置失败:', error);
  }

});
const copyMessageItem = (item:messageType) =>{
  const content = item.content;
  if(content){
    navigator.clipboard.writeText(content).then(() => {
      message.success('复制成功');
    }).catch((err) => {
      message.error('复制失败:', err);
    });
  }
}
const deleteMessageItem = (item:messageType) =>{
  //把所有message的typing设置为false
  messages.value.forEach((m) => {
    m.typing = false;
  })
   
  const index = messages.value.indexOf(item);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
}
watch(
  formData,
  async (newValue) => {
    formData.value.platformName = platforms.value.find((p) => p.value == newValue.platformId)?.label || '';
    formData.value.modelName = models.value.find((m) => m.value == newValue.modelId)?.label || '';
    await mainChatIndexDb.saveConfig({
      id: 'currentConfig',
      platformId: newValue.platformId,
      modelId: newValue.modelId,
      platformName: formData.value.platformName,
      modelName: formData.value.modelName
    });
  },
  { deep: true }
);

</script>

<template>
  <div>
    <n-flex vertical>
      <div style="height: calc(100vh - 300px);">
        <BubbleList :list="messages" max-height="100%">
          <!-- 自定义头部 -->
          <template #header="{ item }">
            <div class="header-wrapper">
              <div class="header-name">
                {{ item.role === 'system' ? '小书芽' : '用户' }}
              </div>
            </div>
            <Thinking v-if="item.reasoning_content" v-model="item.thinlCollapse" :content="item.reasoning_content"
              :status="item.thinkingStatus" auto-collapse @change="handleThinkingChange" />
          </template>
          <template #footer="{ item }">
            <n-flex>
              <n-tooltip>
                <template #trigger>
                  <n-button tertiary circle type="info" >
                    <template #icon>
                      <n-icon>
                        <Edit />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                编辑
              </n-tooltip>
              <n-tooltip>
                <template #trigger>
                  <n-button tertiary circle type="info">
                    <template #icon>
                      <n-icon>
                        <Refresh />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                重新生成
              </n-tooltip>
              <n-tooltip>
                <template #trigger>
                  <n-button tertiary circle type="info" @click="copyMessageItem(item)">
                    <template #icon>
                      <n-icon>
                        <CopyFile />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                复制
              </n-tooltip>
              <n-tooltip>
                <template #trigger>
                  <n-button tertiary circle type="info" @click="deleteMessageItem(item)">
                    <template #icon>
                      <n-icon>
                        <Delete />
                      </n-icon>
                    </template>
                  </n-button>
                </template>
                删除
              </n-tooltip>


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
        <MentionSender ref="senderRef" v-model="senderValue" @submit="handleSendMessage" variant="updown"
          :auto-size="{ minRows: 2, maxRows: 4 }" clearable placeholder="Enter=发送, SHIFT + ENTER = 换行">
          <template #prefix>
            <n-flex>
              <n-button size="small" tertiary circle type="info">
                <template #icon>
                  <n-icon>
                    <Add />
                  </n-icon>
                </template>
              </n-button>
              <n-button-group>

                <n-button size='tiny' secondary @click="handleShowSelectModel()">
                  <template #icon>
                    <n-icon>
                      <TrainIcon />
                    </n-icon>
                  </template>
                  {{ formData.platformName }}|{{ formData.modelName }}
                </n-button>
              </n-button-group>


            </n-flex>
          </template>
        </MentionSender>
      </div>
    </n-flex>
    <n-modal title="大模型配置" v-model:show="showSelectModel" preset="card" style="width: 600px;">
      <n-card>
        <n-flex vertical>
          <n-flex>
            <n-button text size="small">平台</n-button>
            <n-select v-model:value="formData.platformId" :options="platforms" filterable
              @update:value="handlePlatformChange" size="small" class="adaptive-select" :render-label="renderLabel" />
          </n-flex>
          <n-flex>
            <n-button text size="small">模型</n-button>
            <n-select v-model:value="formData.modelId" :options="models" filterable size="small" class="adaptive-select"
              :render-label="renderLabel" />
          </n-flex>
        </n-flex>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped lang="less">
:deep(.markdown-body) {
  background-color: transparent;
}
</style>