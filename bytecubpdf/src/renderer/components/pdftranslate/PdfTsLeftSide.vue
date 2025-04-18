<script lang="ts" setup>
import { ref } from 'vue'
import { NButton, NFlex, NIcon, NTabs, NTabPane } from 'naive-ui'
import { DocumentAdd, RecordingFilled } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['select'])

// 定义菜单项
const menuItems = [
  { key: 'main', label: t('pdfts.leftside.addPdf'), icon: DocumentAdd },
  { key: 'history', label: t('pdfts.leftside.transHistory'), icon: RecordingFilled }
]

// 使用与SettingsLeftSide相同的props设计
defineProps({
  active: {
    type: String,
    default: 'main'
  }
})
</script>

<template>
  <div style="margin-right: 13px">
    <n-tabs type="segment" animated>
      <n-tab-pane name="function" :tab="t('pdfts.leftside.function')">
        <n-flex vertical>
          <n-button 
            v-for="item in menuItems" 
            :key="item.key"
            
            style="justify-content: start; padding-left: 12px"
            :type="active === item.key ? 'primary' : 'default'"
            @click="emit('select', item.key)"
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
        <!-- 设置标签页内容 -->
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
