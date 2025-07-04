<template>
  <div style="margin: 13px; position: relative; ">
    <n-flex vertical>
      <n-input round :placeholder="t('settings.model.leftside.searchPlaceholder')">
        <template #suffix>
          <n-icon :component="Search" />
        </template>
      </n-input>
    </n-flex>

    <!-- 平台列表 -->
    <n-flex 
      vertical 
      style="height: calc(100vh - 180px); overflow-y: auto">
      <n-card 
        v-for="platform in platforms" 
        :key="platform.id"
        :title="platform.platformName"
        size="small"
        hoverable
        :header-style="{ padding: '8px 12px', cursor: 'pointer', backgroundColor: platform.id === selectedPlatformId ? '#f0f0f0' : 'transparent' }"
        @click="handleEditPlatform(platform)"
      >
        <template #header-extra>
          <n-button 
            text 
            @click.stop="handleDeleteClick(platform.id)"
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
      @click="handleAddPlatform"
    >
      <template #icon>
        <n-icon>
          <Add />
        </n-icon>
      </template>
      {{ t('settings.model.leftside.buttons.addPlatform') }}
    </n-button>


    <!-- 添加平台弹框 -->
    <n-modal v-model:show="showAddDialog" :title="t('settings.leftside.buttons.addPlatform')" preset="dialog">
      <n-form :model="newPlatform" ref="addFormRef" label-placement="left" :label-width="80">
        <n-form-item :label="t('settings.model.platformName')" path="platformName">
          <n-input v-model:value="newPlatform.platformName" :placeholder="t('settings.model.platformNamePlaceholder')"/>
        </n-form-item>
        <n-form-item :label="t('settings.model.protocolType')" path="protocolType">
          <n-select 
            v-model:value="newPlatform.protocolType"
            :options="PROTOCOL_CAN_LLM"
            :placeholder="t('settings.model.protocolTypePlaceholder')"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddDialog = false">{{ t('common.cancel') }}</n-button>
        <n-button type="primary" @click="confirmAddPlatform">{{ t('common.add') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>
<script lang="ts" setup>
defineOptions({
  name: 'ModelLeftSide'
})

import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NFlex, NInput, NCard, useDialog,NForm,NSelect,NFormItem,NModal } from 'naive-ui'
import { Search, Add, TrashCan } from '@vicons/carbon'
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager'
import { PROTOCOL_CAN_LLM } from '@/renderer/constants/appconfig'

const { t } = useI18n()
const platforms = ref<Array<any>>([])
const llmManager = new LlmModelManager()
const selectedPlatformId = ref<string | null>(null)
onMounted(async () => {
  await loadPlatforms()
  
})

const loadPlatforms = async () => {
  platforms.value = await llmManager.getPlatforms()
  if (platforms.value.length > 0 ) {
      handleEditPlatform(platforms.value[0])
  }
}

const handleDeletePlatform = async (id: string) => {
  await llmManager.deletePlatform(id)
  await loadPlatforms()
}



const dialog = useDialog()

const handleDeleteClick = (id: string) => {
  if (platforms.value.length <= 1) {
    dialog.error({
      title: t('common.warning'),
      content: t('settings.model.platform.actions.cannotDeleteLast'),
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
      await handleDeletePlatform(id)
    }
  })
}

// 修改添加平台按钮的点击事件
const emit = defineEmits(['addPlatform', 'editPlatform'])
 
const handleEditPlatform = (platform: any) => {
  selectedPlatformId.value = platform.id
  emit('editPlatform', platform.id)
}

const showAddPlatformDialog = () => {
  newPlatform.value = {  platformName: '', protocolType: '' }
  showAddDialog.value = true
}

// 修改PlatformForm接口和初始值
interface PlatformForm {
  platformName: string
  protocolType: string
}

const newPlatform = ref<PlatformForm>({
  platformName: '',
  protocolType: ''
})

// 修改confirmAddPlatform方法中的platformData
const confirmAddPlatform = async () => {
  try {
    const platformData = {
      id: crypto.randomUUID().replace(/-/g, ''),
      platformName: newPlatform.value.platformName,
      protocolType: newPlatform.value.protocolType,
      apiKey: '',
      apiUrl: '',
      isActive: true,
      models: []
    }
    await llmManager.savePlatformWithModels(platformData)
    
    // 刷新平台列表
    await loadPlatforms()
    showAddDialog.value = false
 
  } catch (error) {
    console.error('添加平台失败:', error)
  }
}

// 修改添加平台按钮点击事件
const handleAddPlatform = () => {
  showAddPlatformDialog()
}

// 定义newPlatform的类型
// interface PlatformForm {
//   platformName: string
//   protocolType: string
// }

 
const showAddDialog = ref(false)
</script>
