<script lang="ts" setup>
defineOptions({
  name: 'PdfTsLeftSide'
})

import { ref } from 'vue'
import { NButton, NFlex, NIcon, NTabs, NTabPane } from 'naive-ui'
import { DocumentAdd, RecordingFilled,ScanAlt,ListBoxes,LoadBalancerListener } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits<{
  (e: 'select', key: string, type: 'function' | 'settings'): void
}>()

// 添加标签页切换处理
const handleTabChange = (name: string) => {
  if (name === 'settings') {
    emit('select', 'terms', 'settings') // 触发设置标签页激活
  }else{
    emit('select', 'main','function') // 触发功能标签页激活
  }
}
// 定义菜单项
const menuItems = [
  { key: 'main', label: t('pdfts.leftside.addPdf'), icon: DocumentAdd, type:'function' },
  { key: 'history', label: t('pdfts.leftside.transHistory'), icon: RecordingFilled, type:'function' },
  { key: 'ocrrec', label: '扫描件(图片)识别', icon: ScanAlt, type:'function' },
  { key: 'ocrhistory', label: '扫描识别历史', icon: ListBoxes, type:'function' },
  { key: 'terms', label: '术语管理', icon: LoadBalancerListener, type:'settings' }
]
 
// 使用与SettingsLeftSide相同的props设计
defineProps({
  activeFunction: {
    type: String,
    default: 'main'
  },
  activeSettings: {
    type: String,
    default: 'terms'
  }
})
</script>

<template>
  <div style="margin-right: 13px">
    <n-tabs type="segment" animated @update:value="handleTabChange">
      <n-tab-pane name="function" :tab="t('pdfts.leftside.function')">
        <n-flex vertical>
          <n-button 
            v-for="item in menuItems.filter(item => item.type === 'function')" 
            :key="item.key"
            
            style="justify-content: start; padding-left: 12px"
            :type="activeFunction === item.key ? 'primary' : 'default'"
             @click="emit('select', item.key, 'function')"
          >
            <template #icon>
              <n-icon>
                <component :is="item.icon" />
              </n-icon>
            </template>
            {{ item.label }}
          </n-button>
        </n-flex>
      </n-tab-pane>
      <n-tab-pane name="settings" :tab="t('pdfts.leftside.settings')">
        <n-flex vertical>
          <n-button 
          v-for="item in menuItems.filter(item => item.type === 'settings')" 
            :key="item.key"
            style="justify-content: start; padding-left: 12px"
            :type="activeSettings === item.key ? 'primary' : 'default'"
            @click="emit('select', item.key, 'settings')"
          >
            <template #icon>
              <n-icon>
                <component :is="item.icon" />
              </n-icon>
            </template>
            {{ item.label }}
          </n-button>
        </n-flex>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
