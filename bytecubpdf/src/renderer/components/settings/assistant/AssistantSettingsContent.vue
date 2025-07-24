<script setup lang="ts">
defineOptions({
  name: 'AssistantSettingsContent'
})

import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NForm, NFormItem, NInput, NInputNumber, NButton, useMessage, NCard, FormRules } from 'naive-ui'
import { assistantManager } from '@/renderer/service/manager/AssistantManager'
import { Assistant } from '@/renderer/model/assistant/AssistantDb'
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'

const props = defineProps<{
  id?: number
}>()

const emit = defineEmits(['assistant-updated'])

const { t } = useI18n()
const message = useMessage()
const formRef = ref<InstanceType<typeof NForm>>()
interface AssistantForm {
  name: string
  order_number: number
  description: string
  prompt: string
}

const submitting = ref(false)

const assistantForm = ref<AssistantForm>({
  name: '',
  order_number: 1,
  description: '',
  prompt: ''
})

interface AssistantForm {
  name: string
  order_number: number
  description: string
  prompt: string
}

const rules: FormRules = {
  name: [
    {
      required: true,
      message: '助手名称不能为空',
      trigger: ['input', 'blur']
    }
  ],
  order_number: [
    {
      required: true,
      validator(rule, value) {
        if (value === null || value === undefined || value === '') {
          return new Error('助手排序不能为空')
        }
        if (isNaN(Number(value))) {
          return new Error('请输入有效数字')
        }
        if (Number(value) < 1) {
          return new Error('助手排序不能小于1')
        }
        return true
      },
      trigger: ['input', 'blur']
    }
  ]
}

const loadAssistantData = async () => {
  if (props.id) {
    try {
      const assistant = await assistantManager.getAssistant(Number(props.id))
      if (assistant) {
        assistantForm.value = {
          name: assistant.name,
          order_number: assistant.order_number || 1,
          description: assistant.description || '',
          prompt: assistant.prompt_content || ''
        }
      }
    } catch (error) {
      message.error(t('settings.assistant.messages.loadError'))
      console.error('Failed to load assistant:', error)
    }
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  submitting.value = true
  try {
    await formRef.value.validate()

    const assistantData: Partial<Assistant> = {
      id: props.id ? Number(props.id) : undefined,
      name: assistantForm.value.name,
      order_number: assistantForm.value.order_number,
      description: assistantForm.value.description,
      prompt_content: assistantForm.value.prompt
    }

    if (props.id) {
      await assistantManager.saveAssistant(assistantData)
      message.success('助手更新成功')
    } else {
      await assistantManager.saveAssistant(assistantData)
      message.success('助手创建成功')
    }

    emit('assistant-updated')
  } catch (error) {
    message.error('助手保存失败')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.id,
  () => {
    if (props.id) {
      loadAssistantData()
    } else {
      assistantForm.value = {
        name: '',
        order_number: 1,
        description: '',
        prompt: ''
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div style="padding: 20px;">
    <n-card :bordered="false" :style="{ background: 'rgba(250, 250, 252, 0.8)' }">
      <n-form ref="formRef" :model="assistantForm" :rules="rules" label-placement="left" :label-width="100">
        <n-form-item label="助手名称" path="name">
          <NInput v-model:value="assistantForm.name" placeholder="助手名称" />
        </n-form-item>

        <n-form-item label="助手排序" path="order_number">
          <n-input-number v-model:value="assistantForm.order_number" :min="1" placeholder="助手排序"
            :parse="(value) => Number(value)" />
        </n-form-item>

        <!-- <n-form-item label="助手描述" path="description">
          <NInput v-model:value="assistantForm.description" placeholder="助手描述" />
        </n-form-item> -->

        <n-form-item label="助手定位描述" path="prompt">
          <n-input type="textarea" v-model:value="assistantForm.prompt" placeholder="提示词内容" :rows="6"
            resize="vertical" />
        </n-form-item>

        <n-form-item :style="{ marginLeft: '100px', marginTop: '20px' }">
          <n-button type="primary" @click="handleSave" :loading="submitting">
            {{ t('common.save') }}
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
    <HelpFloatButton url="https://www.docfable.com/docs/usage/settings/assistant.html" />
  </div>
</template>

<style scoped>
/* 表单样式补充 */
::v-deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
