<template>
  <div style="margin: 13px; position: relative; ">
    <n-flex vertical>
      <n-input round placeholder='助手名称'>
        <template #suffix>
          <n-icon :component="Search" />
        </template>
      </n-input>
    </n-flex>

    <!-- 助手列表 -->
    <n-flex 
      vertical 
      style="height: calc(100vh - 180px); overflow-y: auto">
      <n-card 
        v-for="assistant in assistants" 
        :key="assistant.id"
        :title="assistant.name"
        size="small"
        hoverable
        :header-style="{ padding: '8px 12px', cursor: 'pointer', backgroundColor: assistant.id === selectedAssistantId ? '#f0f0f0' : 'transparent' }"
        @click="handleEditAssistant(assistant)"
      >
        <template #header-extra>
          <n-button 
            text 
            @click.stop="handleDeleteClick(assistant.id)"
          >
            <n-icon>
              <TrashCan />
            </n-icon>
          </n-button>
        </template>
      </n-card>
    </n-flex>

    <n-button 
      style="position: fixed;bottom: 20px;width: 160px;" 
      dash
      @click="handleAddAssistant"
    >
      <template #icon>
        <n-icon>
          <Add />
        </n-icon>
      </template>
      新增助手
    </n-button>


    <!-- 添加助手弹框 -->
    <n-modal v-model:show="showAddDialog" :title="t('settings.leftside.buttons.addPlatform')" preset="dialog">
      <n-form :model="newAssistant" ref="addFormRef" label-placement="left" :label-width="80">
        <n-form-item label="助手名称" path="assistantName">
          <n-input v-model:value="newAssistant.assistantName" placeholder="请输入助手名称"/>
        </n-form-item>
        <n-form-item label="排序" path="order_number">
          <n-input-number v-model:value="newAssistant.order_number" placeholder=">=1,数字小靠前排"/>
        </n-form-item>
      </n-form>
      
      <template #action>
        <n-button @click="showAddDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="confirmAddAssistant">{{ t('common.add') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>
<script lang="ts" setup>
defineOptions({
  name: 'AssistantLeftSide'
})

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NFlex, NInput, NCard, useDialog,NForm,NFormItem,NModal,NInputNumber,useMessage } from 'naive-ui'
import { Search, Add, TrashCan } from '@vicons/carbon'
import { assistantManager } from '@/renderer/service/manager/AssistantManager'
import {Assistant} from '@/renderer/model/assistant/AssistantDb' 

const { t } = useI18n()
const message = useMessage()
const assistants = ref<Array<any>>([]) 
const selectedAssistantId = ref<string | null>(null)
onMounted(async () => { 
  await loadAssistants()
})
const showAddDialog = ref(false)
const loadAssistants = async () => {
  assistants.value = await assistantManager.getAssistants()
  if (assistants.value.length > 0 ) {
      handleEditAssistant(assistants.value[0])
  }
}

const handleDeleteAssistant = async (id: number) => {
  //id转化为number
  
  await assistantManager.deleteAssistant(id)
  await loadAssistants()
}



const dialog = useDialog()

const handleDeleteClick = (id: number) => {
  if (assistants.value.length <= 1) {
    dialog.error({
      title: t('common.warning'),
      content:'当前助手列表只有一个助手，不能删除',
      positiveText: t('common.confirm')
    })
    return
  }
  dialog.warning({
    title: t('common.warning'),
    content: t('settings.model.platform.actions.confirmDelete'),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      await handleDeleteAssistant(id)
    }
  })
}

// 修改添加助手按钮的点击事件
const emit = defineEmits(['addAssistant', 'editAssistant'])
 
const handleEditAssistant = (assistant: any) => {
  selectedAssistantId.value = assistant.id
  emit('editAssistant', assistant.id)
}

const showAddAssistantDialog = () => {
  newAssistant.value = {  assistantName: '',order_number: 1 }
  showAddDialog.value = true
}

// 修改AssistantForm接口和初始值
interface AssistantForm {
  assistantName: string,
  order_number: number,
}

const newAssistant = ref<AssistantForm>({
  assistantName: '',
  order_number: 0,
})

// 修改confirmAddAssistant方法中的assistantData
const confirmAddAssistant = async () => {
  try {
    const assistantData = {
      name: newAssistant.value.assistantName,
      order_number: newAssistant.value.order_number
    }
    await assistantManager.saveAssistant(assistantData)
    // 刷新助手列表
    await loadAssistants()
    showAddDialog.value = false
 
  } catch (error) {
    console.error('添加助手失败:', error)
  }
}

// 修改添加助手按钮点击事件
const handleAddAssistant = () => { 
    showAddAssistantDialog()
}


</script>
