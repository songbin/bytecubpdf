<template>
  <n-layout has-sider>
    <n-layout-sider 
    collapse-mode="width"
     
      :width="160"
      :show-collapsed-content=false
       
      bordered>
      <SettingsLeftSide 
        :active="activePanel" 
        @update:active="handlePanelChange"
      />
    </n-layout-sider>
    
    <n-layout-content>
      <component :is="activeComponent" />
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutContent,NIcon } from 'naive-ui'
import SettingsLeftSide from '@/renderer/components/settings/SettingsLeftSide.vue'
import StorageSettings from '@/renderer/components/settings/StorageSettings.vue' 
import ModelSettings from '@/renderer/components/settings/ModelSettings.vue' 
import AssistantSettings from '@/renderer/components/settings/AssistantSettings.vue'

// 当前激活的面板
const activePanel = ref('model')
const route = useRoute()

// 监听路由变化同步面板状态
watch(() => route.name,
  (name) => {
    if (name === 'AssistantSettings') {
      activePanel.value = 'assistant'
    } else if (name === 'ModelSettings') {
      activePanel.value = 'model'
    } else if (name === 'StorageSettings') {
      activePanel.value = 'storage'
    }
  },
  { immediate: true }
)

// 动态计算组件
const activeComponent = computed(() => {
  return {
    storage: StorageSettings,
    model: ModelSettings, 
    assistant: AssistantSettings
  }[activePanel.value]
})

const handlePanelChange = (panelKey: string) => {
  activePanel.value = panelKey
}
</script>