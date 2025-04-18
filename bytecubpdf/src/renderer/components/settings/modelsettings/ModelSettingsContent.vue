<template>
    <div>
        <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="80">
            <n-flex vertical >
                <n-flex vertical class="form-section">
                    <n-flex>
                        <n-form-item :label="t('settings.model.platformName')" path="platformName" 
                            :style="{ marginBottom: 0 }" :show-feedback="false">
                            <n-input v-model:value="formData.platformName" 
                            style="width: 160px"
                                :placeholder="t('settings.model.platformNamePlaceholder')" />
                        </n-form-item>
                        <n-form-item :label="t('settings.model.protocolType')" path="protocolType"  
                            :style="{ marginBottom: 0 }" :show-feedback="false">
                            <n-select 
                                v-model:value="formData.protocolType"
                                :options="PROTOCOL_CAN_LLM"
                                :placeholder="t('settings.model.protocolTypePlaceholder')"
                                clearable
                                style="width: 120px"
                            />
                        </n-form-item>
                        <n-form-item class="full-width-form-item" :show-feedback="false"> 
                            <n-switch size="medium" v-model:value="formData.isActive" />
                        </n-form-item>
                    </n-flex>

                    <!-- API密钥 -->
                    <n-flex>
                        <n-form-item :label="t('settings.model.apiKey')" path="apiKey"  
                            class="full-width-form-item" :show-feedback="false">
                            <n-input-group>
                                <n-input v-model:value="formData.apiKey" 
                                :placeholder="t('settings.model.apiKeyPlaceholder')" 
                                class="full-width-input" />
                                <n-button type="primary" ghost @click="checkApiConnection">
                                    {{ t('settings.model.apiCheck') }}
                                </n-button>
                            </n-input-group>
                           
                        </n-form-item>
                    </n-flex>

                    <!-- API地址 -->
                    <n-flex>
                        <n-form-item :label="t('settings.model.apiUrl')" path="apiUrl"  
                            class="full-width-form-item" :show-feedback="false">
                            <n-input v-model:value="formData.apiUrl" 
                                :placeholder="t('settings.model.apiUrlPlaceholder')" 
                                class="full-width-input" />
                        </n-form-item>
                    </n-flex>

             
                </n-flex>

                <n-flex vertical class="form-section">
                    <n-text strong> <n-button tertiary type="success">
                            {{ t('settings.model.list') }}
                        </n-button>
                    </n-text>
                    <n-flex vertical :style="{ gap: '8px' }">
                        <n-flex v-for="(model, index) in models" :key="index" align="center" :style="{
                            padding: '8px 12px',
                            background: index % 2 === 0 ? 'rgba(250, 250, 252, 0.8)' : 'transparent',
                            justifyContent: 'space-between',
                            borderRadius: '4px'
                        }">
                            <n-flex align="center"
                                :style="{ flex: 1, minWidth: 0, overflow: 'hidden', alignItems: 'center' }">
                                <n-text
                                    :style="{ fontWeight: '500', marginRight: '12px', whiteSpace: 'nowrap', minWidth: '120px' }">
                                    {{ model.name }}
                                </n-text>
                                <n-flex :style="{ gap: '6px', flexWrap: 'wrap', alignItems: 'center' }">
                                    
                                    <n-tag v-for="type in model.types" :key="type" type="info" size="small"
                                        :bordered="false" :style="{
                                            whiteSpace: 'nowrap',
                                            backgroundColor: 'rgba(24, 160, 88, 0.1)',
                                            color: '#18a058'
                                        }">
                                        {{ getTypeLabels()[type] }}
                                    </n-tag>
                                </n-flex>
                            </n-flex>

                            <n-flex :style="{ flexShrink: 0, marginLeft: '12px', gap: '4px' }">
                                <n-button type="primary" text size="small" @click="editModel(index)">
                                    <template #icon>
                                        <n-icon>
                                            <Edit />
                                        </n-icon>
                                    </template>
                                </n-button>
                                <n-button type="error" text size="small" @click="removeModel(index)">
                                    <template #icon>
                                        <n-icon>
                                            <TrashCan />
                                        </n-icon>
                                    </template>
                                </n-button>
                            </n-flex>
                        </n-flex>
                    </n-flex>

                    <n-button type="primary" text @click="showAddModelDialog"
                        :style="{ alignSelf: 'flex-start', marginTop: '8px' }">
                        <template #icon>
                            <n-icon>
                                <Add />
                            </n-icon>
                        </template>
                        {{ t('settings.model.leftside.buttons.addModel') }}
                    </n-button>
                </n-flex>


                <n-flex>
                    <n-button type="primary" @click="handleSave">{{ t('common.save') }}</n-button>
                </n-flex>
            </n-flex>

        </n-form>

        <!-- 添加/编辑模型对话框 -->
        <n-modal v-model:show="showDialog" :title="isEditing ? t('settings.model.dialog.editTitle') : t('settings.model.dialog.addTitle')" preset="dialog"
            :style="{ width: '500px', maxWidth: '90vw' }">
            <n-form :model="currentModel" ref="dialogFormRef" label-placement="left" :label-width="80"
                :style="{ marginTop: '20px' }">
                <n-form-item :label="t('settings.model.dialog.modelId')" path="id" :rule="{
                    required: true,
                    message: t('settings.model.dialog.modelIdRequired'),
                    trigger: ['blur', 'input']
                }">
                    <n-input 
                        v-model:value="currentModel.id" 
                        :placeholder="t('settings.model.dialog.modelIdPlaceholder')" 
                        clearable 
                        @update:value="(val) => { 
                            if (val ) { 
                                currentModel.name = val 
                            } 
                        }"
                    />
                </n-form-item>
                <n-form-item :label="t('settings.model.dialog.modelName')" path="name" :rule="{
                    required: true,
                    message: t('settings.model.dialog.modelNameRequired'),
                    trigger: ['blur', 'input']
                }">
                    <n-input v-model:value="currentModel.name" :placeholder="t('settings.model.dialog.modelNamePlaceholder')" clearable />
                </n-form-item>

               

                <n-form-item :label="t('settings.model.dialog.modelType')" path="types">
                    <n-radio-group v-model:value="currentModel.types[0]">
                        <n-space :size="24" item-style="display: flex;">
                            <n-radio value="text" :label="t('settings.model.types.text')" />
                            <n-radio value="vision" :label="t('settings.model.types.vision')" />
                            <n-radio value="embedded" :label="t('settings.model.types.embedded')" />
                            <n-radio value="multi" :label="t('settings.model.types.multi')" />
                        </n-space>
                    </n-radio-group>
                </n-form-item>
            </n-form>

            <template #action>
                <n-button @click="showDialog = false" :style="{ marginRight: '12px' }">
                    {{ t('common.cancel') }}
                </n-button>
                <n-button type="primary" @click="confirmModel" :disabled="!currentModel.name || !currentModel.id"
                    :loading="submitting">
                    {{ isEditing ? t('common.save') : t('common.add') }}
                </n-button>
            </template>
        </n-modal>
    </div>
</template>

<script lang="ts" setup>
import { ref,watch } from 'vue'
import { useRouter } from 'vue-router'
import {
    NFlex,
    NText,
    NIcon,
    NForm,
    NFormItem,
    NInput,
    NButton,
    NModal,
    NSelect,
    NSpace,
    NTag,
    useMessage,
    NRadio,
    NRadioGroup,
    NSwitch,
    NInputGroup
} from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { PROTOCOL_CAN_LLM } from '@/renderer/constants/appconfig'
import { SettingLLMModel, SettingLLMPlatform, getTypeLabels } from '@/renderer/model/settings/SettingLLM'
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager'
import { ChatService } from '@/renderer/service/chat/ChatService'
const { t } = useI18n()
const message = useMessage()
const selectedProtocol = ref<string | null>(null)
const router = useRouter()
// 使用统一的模型类型
// 在导入部分之后添加数据库管理器实例
const llmManager = new LlmModelManager()

// 修改表单数据类型定义（约第80行）
const formData = ref<Omit<SettingLLMPlatform, 'id' | 'models'>>({
    platformName: '',
    protocolType: '',
    apiKey: '',
    apiUrl: '',
    isActive: true  // 默认激活
});

// 修复模型类型定义（约第86行）
const models = ref<SettingLLMModel[]>([]);
const currentModel = ref<Omit<SettingLLMModel, 'platformId'>>({ // 明确排除platformId
    name: '',
    id: '',
    types: [] as Array<'text' | 'vision' | 'embedded' | 'multi'> // 添加明确类型
});

// 修复表单引用类型（约第73行）
const formRef = ref<InstanceType<typeof NForm>>();
const dialogFormRef = ref<InstanceType<typeof NForm>>();
const rules = {
    platformName: {
        required: true,
        message: t('settings.model.validation.platformName'),
        trigger: ['blur', 'input']
    },
    protocolType: {
        required: true,
        message: t('settings.model.validation.protocolType'),
        trigger: ['blur', 'change']
    },
    apiKey: {
        required: true,
        message: t('settings.model.validation.apiKey'),
        trigger: ['blur', 'input']
    },
    apiUrl: {
        required: true,
        message: t('settings.model.validation.apiUrl'),
        trigger: ['blur', 'input']
    }
}


// 对话框控制
const showDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const currentModelIndex = ref(-1)
 

// 显示添加模型对话框
const showAddModelDialog = () => {
    console.log('showAddModelDialog') // 添加这一行进行调试
    isEditing.value = false
    currentModelIndex.value = -1
    currentModel.value = {
        name: '',
        id: '',
        types: []
    }
    showDialog.value = true
}

// 显示编辑模型对话框
const editModel = (index: number) => {
    isEditing.value = true
    currentModelIndex.value = index
    currentModel.value = {
        name: models.value[index].name,
        id: models.value[index].id,
        types: [...models.value[index].types]
    }
    showDialog.value = true
}

// 确认添加/编辑模型
const confirmModel = async () => {
    submitting.value = true
    try {
        await dialogFormRef.value?.validate()

        const modelData: SettingLLMModel = {
            platformId: props.platformId,
            name: currentModel.value.name.trim(),
            id: currentModel.value.id.trim(),
            types: [...currentModel.value.types]
        }

        if (isEditing.value) {
            models.value[currentModelIndex.value] = modelData
            message.success(t('settings.model.messages.modelUpdateSuccess'))
        } else {
            models.value.push(modelData)
            message.success(t('settings.model.messages.modelAddSuccess'))
        }

        showDialog.value = false
    } catch (errors) {
        console.error('表单验证错误:', errors)
        if (errors instanceof Array) {
            const firstError = errors[0]
            if (firstError) {
                message.error(firstError.message || t('settings.model.messages.formValidationError'))
            }
        } else {
            message.error(t('settings.model.messages.formValidationError'))
        }
    } finally {
        submitting.value = false
    }
}


// 保存表单数据
// 在 setup 部分开头添加
const props = defineProps({
  platformId: {
    type: String,
    default: ''
  },
  isNew: {
    type: Boolean,
    default: false
  }
})

// 使用 isNew 来控制表单状态
watch(() => props.isNew, (newVal) => {
  // 在 watch(() => props.isNew) 回调中也更新为：
  if (newVal) {
      formData.value = {
        platformName: '',
        protocolType: '',
        apiKey: '',
        apiUrl: '',
        isActive: true  // 添加默认激活状态
      }
      models.value = []
  }
}, { immediate: true })

// 在 confirmModel 方法后添加 removeModel 方法
const removeModel = async (index: number) => {
  try {
    const modelId = models.value[index].id
    await llmManager.deleteModel(modelId)
    models.value.splice(index, 1)
    message.success(t('settings.model.messages.modelDeleteSuccess'))
  } catch (error) {
    console.error('删除模型失败:', error)
    message.error(t('settings.model.messages.deleteError'))
  }
}

// 修改数据加载逻辑
const loadPlatformData = async (id: string) => {
  if (id && id !== 'new') {
    try {
      const platform = await llmManager.getPlatform(id)
      const isActiveStatus = typeof platform?.isActive === 'number' 
        ? platform.isActive === 1 
        : Boolean(platform?.isActive) // 处理数字和布尔值两种情况
     if (platform) {
        formData.value = {
          platformName: platform.platformName,
          protocolType: platform.protocolType,
          apiKey: platform.apiKey,
          apiUrl: platform.apiUrl,
          isActive: isActiveStatus
        }
        models.value = platform.models || []
      }
      
      console.log('加载平台数据2:', JSON.stringify(formData.value)) // 调试用，确保数据正确加载
    } catch (error) {
      console.error('加载平台数据失败:', error)
      message.error(t('settings.model.messages.loadError'))
    }
  } else if (props.isNew) {
    // 新增平台时重置表单
    formData.value = {
      platformName: '',
      protocolType: '',
      apiKey: '',
      apiUrl: '',
      isActive: true 
    }
    models.value = []
  }
}

// 监听 platformId 变化
watch(() => props.platformId, async (newId) => {
  await loadPlatformData(newId)
}, { immediate: true })
const emit = defineEmits(['platform-updated'])
// 修改 handleSave 方法
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    const updateId = props.platformId === 'new' ? crypto.randomUUID() : props.platformId
    const platformData: SettingLLMPlatform = {
      id: updateId,
      platformName: formData.value.platformName,
      protocolType: formData.value.protocolType,
      apiKey: formData.value.apiKey,
      apiUrl: formData.value.apiUrl,
      isActive: formData.value.isActive,
      models: models.value
    }
    // console.log('保存平台数据:', platformData)
    const savedPlatform = await llmManager.savePlatformWithModels(platformData)
    message.success(t('settings.model.messages.saveSuccess'))
     
  } catch (error) {
    console.error('保存失败:', error)
    message.error(t('settings.model.messages.saveError'))
  }
}
const chatService = new ChatService()

const checkApiConnection = async () => {
  try {
    if (!props.platformId) {
      message.warning(t('settings.model.messages.saveFirst'))
      return
    }
    if (!formData.value.apiKey) {
      message.warning(t('settings.model.validation.apiKey'))
      return
    }
    await handleSave()
    message.loading(t('settings.model.messages.checkingApi'))
    await chatService.echoTest(props.platformId)
    message.success(t('settings.model.messages.apiCheckSuccess'))
  } catch (error) {
    console.error('API检查失败:', error)
    message.error(t('settings.model.messages.apiCheckFailed'))
  }
}
</script>

<style scoped>
.form-section {
    border: 1px dashed #e0e0e0;
    border-radius: 6px;
    background-color: rgba(250, 250, 252, 0.8);
    width: 100%;
    padding: 12px 12px;
}

.full-width-form-item {
    flex: 1 1 auto;
    max-width: 100%;
    margin-bottom: 0;
}

.full-width-input .n-input {
    width: 100%;
}

/* 模型标签样式 */
.model-tag {
    margin-right: 6px;
    padding: 0 8px;
    height: 24px;
    line-height: 24px;
    font-size: 12px;
}

/* 对话框输入框样式 */
.dialog-input {
    width: 100%;
    margin-bottom: 16px;
}

/* 按钮间距 */
.action-buttons {
    margin-top: 24px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>