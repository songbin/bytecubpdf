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
import { ref, computed } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent,NIcon } from 'naive-ui'
import SettingsLeftSide from '@/renderer/components/settings/SettingsLeftSide.vue'
import StorageSettings from '@/renderer/components/settings/StorageSettings.vue' 
import ModelSettings from '@/renderer/components/settings/ModelSettings.vue' 
import AssistantSettings from '@/renderer/components/settings/AssistantSettings.vue'

// 当前激活的面板
const activePanel = ref('model')

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