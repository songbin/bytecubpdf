<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { BubbleListItemProps, BubbleListProps,BubbleListInstance } from 'vue-element-plus-x/types/BubbleList'
import { BubbleList, MentionSender, Thinking } from 'vue-element-plus-x'
import aiAvatar from '@/renderer/assets/avatars/ai-avatar.png'
import userAvatar from '@/renderer/assets/avatars/user-avatar.png'
import { NFlex, NButton, NIcon, NSelect, NTag, NTooltip, NButtonGroup, useMessage, NModal, NCard } from 'naive-ui'
import { Delete, CopyFile, Edit, SendAlt, Temperature } from '@vicons/carbon'
import { Refresh, Attach, Add, TrainOutline as TrainIcon } from '@vicons/ionicons5';
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager';
import MainChatIndexDb from '@/renderer/service/indexdb/MainChatIndexDb';
import { ChatService } from '@/renderer/service/chat/ChatService';
import { LlmResModel } from "@/renderer/llm/model/LlmResModel";
import {buildId} from '@/shared/utils/StringUtil'
import { messageType } from '@/renderer/model/chat/ChatMessage'
import { ChatMsgToLLM } from '@/renderer/service/chat/MessageConvert'
import type { ThinkingStatus } from 'vue-element-plus-x/types/Thinking';
import {chatMsgStorageService} from '@/renderer/service/chat/ChatMsgStorageService'
import { LLM_PROTOCOL } from '@/renderer/constants/appconfig';
const chatService = new ChatService()
const message = useMessage()
const llmManager = new LlmModelManager();
const mainChatIndexDb = new MainChatIndexDb();
const chatId = ref('')
const chatName = ref('')
const disableSender = ref(true)
const senderHolder = ref('只有选中聊天才可用，没有的话新建一个吧')
const senderLoading = ref(false)
const bubbleListRef = ref<BubbleListInstance | null>(null);
const controller = ref<AbortController | null>(null);
const isThinking = ref(false)
const showThinking = ref(false)
 
const formData = ref({
  platformId: '',
  platformName: '',
  modelId: '',
  modelName: '',
})
//定义接受来自父组件的属性chatId和chatName
const props = defineProps<{
  chatId: string;
  chatName: string;
}>();

const platforms = ref<Array<{ value: string; label: string }>>([]);
const models = ref<Array<{ value: string; label: string }>>([]);

const senderValue = ref('')

// 示例调用
const messages = ref<BubbleListProps<messageType>['list']>([]);

const loadMsg = async (chat_id:string , chat_name:string) => {
  if (!chatId || !chatName) {
    message.error('参数错误')
    return
  } 
  chatId.value = chat_id
  chatName.value = chat_name
  try {
    const msgList = await chatMsgStorageService.getMessagesByChatId(chat_id)
    messages.value = msgList
  } catch (error) {
    message.error(`获取消息失败: ${error instanceof Error ? error.message : String(error)}`)
    return
  }
  
}
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
  try {
    await chatMsgStorageService.saveMessage(messageUserItem)
    senderValue.value = ''
    askSSE()
  } catch (error) {
    message.error(`保存用户消息失败: ${error instanceof Error ? error.message : String(error)}`)
  }
  

}
const cancelSse = async () => {
   if (controller.value) {
    controller.value.abort();
    senderLoading.value = false
  }
}
const askSSE = async () => {
  try {
    senderLoading.value = true
    bubbleListRef.value?.scrollToBottom();
    controller.value = new AbortController();
    const stream = chatService.stream(formData.value.platformId,
      formData.value.modelId,
      0.7,
      4096,
      ChatMsgToLLM(messages.value),controller.value.signal, isThinking.value)


    const messageAssistantItem = buildMessageItem('assistant', '')
    messages.value.push(messageAssistantItem)
    for await (const chunk of stream) {
      const message:LlmResModel = chunk
      messages.value[messages.value.length - 1].content += message?.getContent() || '';
      messages.value[messages.value.length - 1].reasoning_content += message?.getReasoningContent() || ''
      messages.value[messages.value.length - 1].thinkingStatus = parseThinkStatus()
      await nextTick();
    }
    try {
      await chatMsgStorageService.saveMessage(messageAssistantItem)
    } catch (error) {
      message.error(`保存AI消息失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  } catch (error) {
    const error_msg = '请求大模型平台失败' + (error as Error).message
    message.error(error_msg)
  }finally{
    senderLoading.value = false
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
  const key = buildId();
  const reasoning_content = ''//?: string
  const nowTime = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-').replace(/\s/, ' ');

  return {
    key, // 唯一标识
    nowTime,
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
    chatId:chatId.value
  }
}
// 监听属性chatId的变化
    watch(() => props.chatId, async (newChatId, oldChatId) => {
      if (newChatId) {
        if(!newChatId){
          disableSender.value = true
        }else{
          disableSender.value = false
          await loadMsg(newChatId, props.chatName);
          senderHolder.value = 'ENTER=发送  SHIFT+ENTER=换行'
        }
      }
    });
const initializeChatConfig = async () => {
  try {
    // 1. 先加载平台列表（确保后续逻辑可用）
    const platformList = await llmManager.getPlatforms();
    platforms.value = platformList.map(p => ({
      value: p.id,
      label: p.platformName,
    }));

    // 2. 读取配置
    const config = await mainChatIndexDb.getConfig();

    // 3. 应用配置或默认值
    if (config?.platformId) {
      const platformExists = platforms.value.some(p => p.value === config.platformId);
      if (platformExists) {
        formData.value = {
          platformId: config.platformId,
          modelId: config.modelId || '',
          platformName: config.platformName || '',
          modelName: config.modelName || '',
        };
        await handlePlatformChange(config.platformId);
        // 检查配置的 modelId 是否存在于当前模型列表中
          const modelExists = models.value.some(m => m.value === config.modelId);
          if (modelExists) {
            formData.value.modelId = config.modelId || '';
            formData.value.modelName = config.modelName || '';
          } else if (models.value.length > 0) {
            // 否则使用第一个模型作为默认值
            formData.value.modelId = models.value[0].value;
            formData.value.modelName = models.value[0].label;
          }
      } else {
        // 配置的 platformId 不存在，使用默认
        throw new Error('配置的平台不存在，可能已被移除');
      }
    } else {
      // 无有效配置，使用默认平台
      if (platforms.value.length > 0) {
        formData.value.platformId = platforms.value[0].value;
        await handlePlatformChange(platforms.value[0].value);
      }
    }
  } catch (error) {
    console.error('初始化失败:', error);
    // 出错时也尝试使用默认平台
    if (platforms.value.length > 0 && formData.value.platformId === '') {
      formData.value.platformId = platforms.value[0].value;
      await handlePlatformChange(platforms.value[0].value);
    }
  }
}
onMounted(async () => {
   
 await initializeChatConfig()

});
const copyMessageItem = (item:messageType) =>{
  let content = item.content;
 
  if(content){
    if(item.role == 'assistant'){
      content = content + '\n来自小书芽(DocFable.com)'
    }
    navigator.clipboard.writeText(content).then(() => {
      message.success('复制成功');
    }).catch((err) => {
      message.error('复制失败:', err);
    });
  }
}
const refreshMessage = async (item:messageType) =>{
  //如果item是user那就在messages中把这条item之后的item都删除，如果item是assistant，那就把这条item以及后面的item都删除
  //你应该先看这条item在messages的index是多少，保留index之前的元素，然后根据role的值，决定是否保留这条item
  const index = messages.value.findIndex(msg => msg.key === item.key);
  if(index == -1){
    return;
  }
  let deleteMessages = []
  if(item.role == 'user'){
    //保留当前item以及之前的item
    deleteMessages = messages.value.slice(index + 1);
    messages.value = messages.value.slice(0, index + 1);
  }else{
    //值保留当前item之前的
    deleteMessages = messages.value.slice(index);
    messages.value = messages.value.slice(0, index);
  }
  //这里还需要计算出所有被删除的message的key
  const keys = deleteMessages.map(msg => msg.key);
  try{
    try {
      await chatMsgStorageService.deleteMessagesByKeys(chatId.value, keys)
      askSSE()
    } catch (error) {
      message.error(`删除多条消息失败: ${error instanceof Error ? error.message : String(error)}`)
      console.log(error)
    }
  }catch(error){
    message.error(`重新生成失败: ${error instanceof Error ? error.message : String(error)}`)
    console.log(error)
  }
}
const deleteMessageItem = async (item:messageType) =>{
  //把所有message的typing设置为false
  messages.value.forEach((m) => {
    m.typing = false;
  })
  try {
    await chatMsgStorageService.deleteMessage(chatId.value, item.key)
    const index = messages.value.indexOf(item);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  } catch (error) {
    message.error(`删除消息失败: ${error instanceof Error ? error.message : String(error)}`)
  }
  
}
const calcThinkingShowStatus = async (platformId:string,modelId:string) =>{
    try{
      showThinking.value = false
      const platformBasicInfo = await llmManager.getPlatformBasicInfo(platformId);
      if(platformBasicInfo){
        if(LLM_PROTOCOL.ollama === platformBasicInfo.protocolType){
          //如果modelId为deepseek-r1  qwen3  magistral granite3.2这里面其中一个，showThinkig就设置为true，否则设置为false
          const baseModelId = modelId.split(':')[0]; // 提取冒号前的基础模型ID
          if(['deepseek-r1','qwen3','magistral','granite3.2'].includes(baseModelId)){
            showThinking.value = true
          }else{
            isThinking.value = false
          }
        }
      }
    }catch(error){
      console.log(error)
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
   await calcThinkingShowStatus(newValue.platformId,newValue.modelId)

  },
  { deep: true }
);

</script>

<template>
  <div>
    <n-flex vertical>
      <div style="height: calc(100vh - 300px);">
        <BubbleList :list="messages" ref="bubbleListRef" max-height="100%">
          <!-- 自定义头部 -->
          <template #header="{ item }">
            <div class="header-wrapper">
              <div class="header-name">
                {{ item.role === 'user' ? item.nowTime + ' 用户' : '小书芽 ' + item.nowTime }}
              </div>
            </div>
            <Thinking v-if="item.reasoning_content" v-model="item.thinlCollapse" :content="item.reasoning_content"
              :status="item.thinkingStatus" auto-collapse @change="handleThinkingChange" />
          </template>
          <template #footer="{ item }">
            <n-flex>
              
              <n-tooltip>
                <template #trigger>
                  <n-button tertiary circle type="info" @click="refreshMessage(item)">
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
        <MentionSender ref="senderRef" v-model="senderValue"
          :disabled="disableSender"
          :loading="senderLoading"
          @cancel="cancelSse"
           @submit="handleSendMessage" variant="updown"
          :auto-size="{ minRows: 2, maxRows: 4 }" clearable :placeholder="senderHolder">
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
              <div :class="{ isThinking }" 
              style="display: flex; align-items: center; gap: 4px; padding: 2px 12px; border: 1px solid silver; border-radius: 15px; cursor: pointer; font-size: 12px;" 
              v-if="showThinking"
              @click="isThinking = !isThinking">
                <span>深度思考</span>
              </div>

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
.isThinking {
  color: #626aef;
  border: 1px solid #626aef !important;
  border-radius: 15px;
  padding: 3px 12px;
  font-weight: 700;
}
</style>