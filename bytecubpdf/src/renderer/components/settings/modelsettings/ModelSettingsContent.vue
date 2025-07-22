<template>
    <div>
        <n-form ref="formRef" :model="formData" :rules="rules" label-placement="left" :label-width="80">
            <n-flex vertical>
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
                        <n-form-item class="full-width-form-item" :show-feedback="false" > 
                            <n-switch size="medium" v-model:value="formData.isActive" />
                        </n-form-item>
                    </n-flex>

                    <!-- API密钥 -->
                    <n-flex vertical>
                        <n-form-item :label="t('settings.model.apiKey')" path="apiKey"  
                            class="full-width-form-item" :show-feedback="false">
                            <n-input-group>
                                <n-input 
                                    v-model:value="formData.apiKey" 
                                    :placeholder="formData.protocolType === LLM_PROTOCOL.ollama 
                                        ? t('settings.model.apiKeyPlaceholder.ollama') 
                                        : t('settings.model.apiKeyPlaceholder.default')" 
                                   
                                    class="full-width-input" />
                                <n-button type="primary" ghost @click="checkApiConnection">
                                    {{ t('settings.model.apiCheck') }}
                                </n-button>
                            </n-input-group>
                        </n-form-item>
                        <n-flex justify="end" v-if="['zhipu', 'deepseek', 'silicon', 'datascope', 'openrouter'].includes(formData.id)">
                            <n-button text size="tiny" type="info" @click="openGuide(formData.id)">
                                {{formData.platformName}}密钥申请指南</n-button>
                        </n-flex>
                        
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
                    <n-text strong>
                        <n-button tertiary type="success">
                            {{ t('settings.model.list') }}
                        </n-button>
                    </n-text>
                    <n-flex vertical :style="{
                        gap: '8px',
                        maxHeight: '260px',
                        overflow: 'auto'
                    }">
                        <n-flex v-for="(model, index) in models" :key="model.id" align="center" :style="{
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
                :rules="dialogRules" :style="{ marginTop: '20px' }">
                <n-form-item :label="t('settings.model.dialog.modelId')" path="id">
                    <n-input 
                        v-model:value="currentModel.id" 
                        :placeholder="t('settings.model.dialog.modelIdPlaceholder')" 
                        clearable 
                        @update:value="handleModelIdUpdate"
                    />
                </n-form-item>
                <n-form-item :label="t('settings.model.dialog.modelName')" path="name">
                    <n-input v-model:value="currentModel.name" :placeholder="t('settings.model.dialog.modelNamePlaceholder')" clearable />
                </n-form-item>

                <n-form-item :label="t('settings.model.dialog.modelType')" path="types">
                    <n-radio-group v-model:value="currentModel.types[0]">
                        <n-space :size="24" item-style="display: flex;">
                            <n-radio v-for="type in modelTypes" :key="type.value" 
                                :value="type.value" 
                                :label="t(type.label)" />
                        </n-space>
                    </n-radio-group>
                </n-form-item>

                <!-- <n-form-item label="是否收费"> 
                    <n-switch v-model:value="currentModel.isFree">
                        <template #checked>
                        免费模型
                        </template>
                        <template #unchecked>
                        收费模型
                        </template>
                    </n-switch>
                </n-form-item> -->
            </n-form>

            <template #action>
                <n-button @click="showDialog = false" :style="{ marginRight: '12px' }">
                    {{ t('common.cancel') }}
                </n-button>
                <n-button type="primary" @click="confirmModel" :loading="submitting">
                    {{ isEditing ? t('common.save') : t('common.add') }}
                </n-button>
            </template>
        </n-modal>
        <HelpFloatButton url="https://www.docfable.com/docs/usage/settingsmentor/llm.html" />
    </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'ModelSettingsContent'
})
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue' 
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
    NInputGroup,
    FormRules
} from 'naive-ui'
import { Add, TrashCan, Edit } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import { PROTOCOL_CAN_LLM, LLM_PROTOCOL } from '@/renderer/constants/appconfig'
import { SettingLLMModel, SettingLLMPlatform, getTypeLabels } from '@/renderer/model/settings/SettingLLM'
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager'
import { ChatService } from '@/renderer/service/chat/ChatService'

type ModelType = 'text' | 'vision' | 'embedded' | 'multi'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()
const llmManager = new LlmModelManager()
const chatService = new ChatService()
const openGuide = (id:string) =>{
    if(id === 'silicon'){
        window.electronAPI.openExternal('https://www.docfable.com/docs/platform/siliconguide.html')
    }else if (id === 'zhipu'){
        window.electronAPI.openExternal('https://www.docfable.com/docs/platform/chatglmguide.html')
    }else if (id === 'deepseek'){
        window.electronAPI.openExternal('https://www.docfable.com/docs/platform/deepseekguide.html')
    }else if (id == 'datascope'){
        window.electronAPI.openExternal('https://bailian.console.aliyun.com/?tab=model#/api-key')
    }else if (id == 'openrouter'){
        window.electronAPI.openExternal('https://openrouter.ai/settings/keys')
    }
    else{
        window.electronAPI.openExternal('https://www.docfable.com/docs/usage/settingsmentor/llm.html')
    }
}
// Props
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

// Emits
const emit = defineEmits(['platform-updated'])

// Form refs
const formRef = ref<InstanceType<typeof NForm>>()
const dialogFormRef = ref<InstanceType<typeof NForm>>()

// Data
const formData = ref<Omit<SettingLLMPlatform, 'models'>>({
    id: '',
    platformName: '',
    protocolType: '',
    apiKey: '',
    apiUrl: '',
    isActive: true
})

const models = ref<SettingLLMModel[]>([])
const currentModel = ref<Omit<SettingLLMModel, 'platformId'>>({
    auto_id: 0,
    name: '',
    id: '',
    types: [] as ModelType[]
})

// UI state
const showDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const currentModelIndex = ref(-1)

// Constants
const modelTypes = computed(() => [
    { value: 'text', label: 'settings.model.types.text' },
    { value: 'vision', label: 'settings.model.types.vision' },
    { value: 'embedded', label: 'settings.model.types.embedded' },
    { value: 'multi', label: 'settings.model.types.multi' }
])

const pricingTypes = computed(() => [
    { value: 'free', label: '免费' },
    { value: 'charge', label: '收费' }
])
// Rules
const rules: FormRules = {
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

const dialogRules: FormRules = {
    id: {
        required: true,
        message: t('settings.model.dialog.modelIdRequired'),
        trigger: ['blur', 'input']
    },
    name: {
        required: true,
        message: t('settings.model.dialog.modelNameRequired'),
        trigger: ['blur', 'input']
    },
    types: {
        validator: (_rule, value: ModelType[]) => {
            return value.length > 0 || new Error('请选择模型类型')
        },
        trigger: ['blur', 'change']
    }
}

// Watchers
watch(() => props.platformId, loadPlatformData, { immediate: true })

watch(() => formData.value.protocolType, (newVal) => {
    if (newVal === LLM_PROTOCOL.ollama) {
        if (!formData.value.apiKey) {
            formData.value.apiKey = generateRandomKey()
        }
    }
})

// Methods
function generateRandomKey(length = 10): string {
    //const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    //return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return 'ollama协议下随便填个字符串'
}

function handleModelIdUpdate(val: string) {
    if (val && !currentModel.value.name) {
        currentModel.value.name = val
    }
}

async function loadPlatformData(id: string) {
    if (id && id !== 'new') {
        try {
            const platform = await llmManager.getPlatform(id)
            if (platform) {
                formData.value = {
                    platformName: platform.platformName,
                    protocolType: platform.protocolType,
                    apiKey: platform.apiKey,
                    apiUrl: platform.apiUrl,
                    isActive: Boolean(platform.isActive),
                    id: platform.id,
                }
                models.value = platform.models || []
            }
        } catch (error) {
            message.error(t('settings.model.messages.loadError'))
            console.error('Failed to load platform:', error)
        }
    } else if (props.isNew) {
        formData.value = {
            id: '',
            platformName: '',
            protocolType: '',
            apiKey: '',
            apiUrl: '',
            isActive: true
        }
        models.value = []
    }
}

function showAddModelDialog() {
    isEditing.value = false
    currentModelIndex.value = -1
    currentModel.value = { name: '', id: '', types: [] }
    showDialog.value = true
}

function editModel(index: number) {
    isEditing.value = true
    currentModelIndex.value = index
    currentModel.value = { ...models.value[index] }
    showDialog.value = true
}

async function confirmModel() {
    submitting.value = true
    try {
        await dialogFormRef.value?.validate()
        if(currentModel.value.isFree) {
            currentModel.value.pricingType = 'free'
        } else {
            currentModel.value.pricingType = 'charge'
        }
        const modelData: SettingLLMModel = {
            ...currentModel.value,
            platformId: props.platformId,
            types: currentModel.value.types.filter(Boolean) as ModelType[]
        }

        // 直接写入数据库
        if (isEditing.value) {
            await llmManager.updateModel(modelData)
            // models.value.splice(currentModelIndex.value, 1, modelData)
            await loadPlatformData(modelData.platformId)
        } else {
            await llmManager.addModel(modelData)
            // models.value.push(modelData)
            await loadPlatformData(modelData.platformId)
        }

        showDialog.value = false
        message.success(t(isEditing.value 
            ? 'settings.model.messages.modelUpdateSuccess'
            : 'settings.model.messages.modelAddSuccess'))
    } catch (errors) {
        message.error(t('settings.model.messages.formValidationError'))
    } finally {
        submitting.value = false
    }
}

async function removeModel(index: number) {
    try {
        const modelId = models.value[index].id
        await llmManager.deleteModel(formData.value.id, modelId)
        models.value.splice(index, 1)
        message.success(t('settings.model.messages.modelDeleteSuccess'))
    } catch (error) {
        message.error(t('settings.model.messages.deleteError'))
    }
}
//以前这里是把所有模型删除然后从新写入
//现在修改为只保存平台就行了
//因为模型的修改已经单独处理了
async function handleSave() {
    try {
        await formRef.value?.validate()
        
        const platformData: SettingLLMPlatform = {
            ...formData.value,
            models: models.value
        }
        await llmManager.savePlatform(platformData)
        // await llmManager.savePlatformWithModels(platformData)
        message.success(t('settings.model.messages.saveSuccess'))
        emit('platform-updated', platformData.id)
    } catch (error) {
        message.error(t('settings.model.messages.saveError'))
    }
}

async function checkApiConnection() {
    try {
        await handleSave()
        message.loading(t('settings.model.messages.checkingApi'))
        await chatService.echoTest(props.platformId)
        message.success(t('settings.model.messages.apiCheckSuccess'))
    } catch (error) {
        console.log('检查api key异常', error)
        const err = error as Error
        message.error(t('settings.model.messages.apiCheckFailed') + ': ' + err.message)
    }
}
</script>

<style scoped>
.form-section {
    border: 1px dashed #e0e0e0;
    border-radius: 6px;
    background-color: rgba(250, 250, 252, 0.8);
    padding: 6px;
    margin-bottom: 16px;
}

.full-width-form-item {
    flex: 1;
    max-width: 100%;
}

.full-width-input .n-input {
    width: 100%;
}

.model-tag {
    margin-right: 6px;
    padding: 0 8px;
}
</style>