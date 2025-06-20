<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { BubbleListItemProps, BubbleListProps } from 'vue-element-plus-x/types/BubbleList'
import { BubbleList, MentionSender } from 'vue-element-plus-x'
import aiAvatar from '@/renderer/assets/avatars/ai-avatar.png'
import userAvatar from '@/renderer/assets/avatars/user-avatar.png'
import { NFlex, NButton, NIcon,NSelect,NTag,NButtonGroup,useMessage } from 'naive-ui'
import { Delete, CopyFile, Edit,SendAlt } from '@vicons/carbon'
import { Refresh,Attach,Add,TrainOutline as TrainIcon } from '@vicons/ionicons5';
import { BrainCircuit20Regular } from '@vicons/fluent';
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager';
import MainChatIndexDb from '@/renderer/service/indexdb/MainChatIndexDb';

type listType = BubbleListItemProps & {
  key: number
  role: 'user' | 'ai'
}
const message = useMessage()
const llmManager = new LlmModelManager();
const mainChatIndexDb = new MainChatIndexDb();
const formData = ref({
  platformId: '',
  platformName:'',
  modelId: '',
  modelName:'',
})
const platforms = ref<Array<{ value: string; label: string }>>([]);
const models = ref<Array<{ value: string; label: string }>>([]);

const senderValue = ref('')
const isSelect = ref(false)

// 示例调用
const list: BubbleListProps<listType>['list'] = generateFakeItems(5)
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
const renderLabel = (option: { label: string }) => {
  return option.label;
}
const showSelectModel = () =>{
  message.success('111')
}
onMounted(async () => {
  try {
    await mainChatIndexDb;
    const config = await mainChatIndexDb.getConfig();
    if (config) {
      formData.value = {
        platformId: config.platformId || '',
        modelId: config.modelId || '',
        platformName:config.platformName || '',
        modelName:config.modelName || '',
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
   if(formData.value.platformId == ''){
     formData.value.platformId = platforms.value[0].value;
     formData.value.platformName = platforms.value[0].label;
     handlePlatformChange(formData.value.platformId);
   }

  } catch (error) {
    console.error('加载配置失败:', error);
  }
   
});

watch(
  formData,
  async (newValue) => {
    await mainChatIndexDb.saveConfig({
      id: 'currentConfig', 
      platformId: newValue.platformId,
      modelId: newValue.modelId,
      platformName:newValue.platformName,
      modelName:newValue.modelName
    });
  },
  { deep: true }
);
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
          <n-flex>
              <n-button size="small" tertiary circle type="info">
              <template #icon>
                <n-icon>
                  <Add />
                </n-icon>
              </template>
            </n-button>
            <n-button-group>
             
              <n-button  size='tiny' secondary  @click="showSelectModel()">
                <template #icon>
                  <n-icon><TrainIcon/></n-icon>
                </template>
                  {{formData.platformName}}|{{ formData.modelName }}
              </n-button>
            </n-button-group>
            
             <n-select 
              v-model:value="formData.platformId" 
              :options="platforms"  
              filterable 
              @update:value="handlePlatformChange"
              menu-size="tiny" 
              size="tiny"
              class="adaptive-select"
              :render-label="renderLabel"
            />
            
            
            <n-select 
              v-model:value="formData.modelId" 
              :options="models"  
              filterable 
              menu-size="tiny" 
              size="tiny"
              class="adaptive-select"
              :render-label="renderLabel"
            />
          </n-flex>
        </template>

        <template #action-list>
          <n-flex  >
             <n-button size="small" tertiary circle type="primary">
              <template #icon>
                <n-icon>
                  <SendAlt />
                </n-icon>
              </template>
              </n-button>
        </n-flex>
           
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
/* 新增自适应选择器样式 */
.adaptive-select {
  display: inline-block;
  width: auto !important;
}

/* 深度选择器修改内部样式 */
.adaptive-select :deep(.n-base-selection) {
  padding: 0 4px !important; /* 减少左右内边距 */
}

.adaptive-select :deep(.n-base-selection__input) {
  min-width: 0.5rem !important; /* 允许宽度收缩 */
}

.adaptive-select :deep(.n-base-selection-label) {
  padding: 0 !important; /* 移除标签内边距 */
  display: inline-block;
}

.adaptive-select :deep(.n-base-selection__suffix) {
  margin-left: 2px !important; /* 调整图标间距 */
}
</style>