<template>
  <div>
    <n-card :title="t('settings.storage.title')" class="settings-card">
      <n-form ref="formRef" :model="storageForm">
        <n-form-item :label="t('settings.storage.pathLabel')" path="storagePath">
          <n-input 
            v-model:value="storageForm.storagePath"
            :placeholder="t('settings.storage.pathPlaceholder')"
            :loading="loading"
            clearable
          >
            <template #suffix>
              <n-button 
                secondary 
                type="primary" 
                @click="handleSelectFolder"
                :disabled="loading"
              >
                更改存储路径
              </n-button>
              <n-button
                circle tertiary 
                @click="handleOpenFolder"
                :disabled="!storageForm.storagePath || loading"
              >
              <template #icon>
                <n-icon><SearchLocate /></n-icon>
              </template>
              
              </n-button>
            </template>
          </n-input>
        </n-form-item>
      </n-form>
      <n-tag>初始存储路径</n-tag> {{ originPath }}<br/>
      <n-tag>上次存储路径</n-tag> {{ lastPath }}
    </n-card>
    <HelpFloatButton url="https://www.docfable.com/docs/usage/settingsmentor/system.html" />
  </div>
  </template>
  
  <script lang="ts" setup>
  defineOptions({
    name: 'StorageSettings'
  })
  
  import { ref, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { NButton, NCard,NTag, NForm, NFormItem, NInput, NIcon, useMessage,useDialog } from 'naive-ui'
  import { configService } from '@/renderer/service/ConfigService'
 import { SearchLocate } from '@vicons/carbon'
 import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue' 
  const originPath = ref('')
  const lastPath = ref('')
  const { t } = useI18n()
  const message = useMessage()
  const dialog = useDialog(); // 添加对话框 hook
  // 表单状态
  const storageForm = ref({
    storagePath: ''
  })
  
  // 加载状态
  const loading = ref(true) 
  
  // 初始化加载路径
  onMounted(async () => {
    try {
      const path = await configService.getFileStoragePath()
      storageForm.value.storagePath = path || ''
      originPath.value = await window.electronAPI?.getInitPath()
      lastPath.value = await window.electronAPI?.getLastFileStoragePath() || ''
    } catch (error) {
      console.log('获取路径失败', error)
      message.error(t('settings.storage.loadError'))
    } finally {
      loading.value = false
    }
  })
  
  // 处理文件夹选择
  const handleSelectFolder = async () => {
      try {
          const path = await window.electronAPI?.openDirectory()
          if (path) {
              storageForm.value.storagePath = path.replace(/\\/g, '/')
              await configService.saveFileStoragePath(storageForm.value.storagePath)
              await (window as any).electronAPI?.DbInitTables()
              //来个弹窗，提示要重启应用
              dialog.success({
                  title: 'INFO',
                  content: '更改路径后需重启应用才能生效',
                   
                });
          }
      } catch (error) {
          message.error(t('settings.storage.selectError'))
          console.error('目录选择失败:', error)
      }
  }
  const handleOpenFolder = async () => {
    if (!storageForm.value.storagePath) return
    try {
        await (window as any).window.electronAPI?.openPath(storageForm.value.storagePath)
    } catch (error) {
        message.error(t('settings.storage.openError'))
        console.error('打开文件夹失败:', error)
    }
}
   
  </script>
  
  <style scoped>
  .settings-card {
    max-width: 600px;
    margin: 20px;
  }
  </style>