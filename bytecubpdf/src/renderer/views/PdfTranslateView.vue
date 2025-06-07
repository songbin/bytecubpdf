<template>
  <n-layout has-sider>
    <n-layout-sider
      collapse-mode="width"
      :collapsed-width="1"
      :width="200"
      :show-collapsed-content=false
      show-trigger
      bordered
    >
      <PdfTsLeftSide 
        :active-function="activeFunctionKey"
        :active-settings="activeSettingsKey"
        @select="handleSidebarSelect"
      />
    </n-layout-sider>
    <n-layout-content>
      <keep-alive include="PdfTsMain">
        <component :is="activeTab === 'function' ? activeFunctionComponent : activeSettingsComponent" />
      </keep-alive>
      <DownloadComponent />
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { ref, shallowRef,type Component,nextTick } from 'vue'
import type { DefineComponent } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import PdfTsLeftSide from '@/renderer/components/pdftranslate/PdfTsLeftSide.vue' 
import PdfTsMain from '@/renderer/components/pdftranslate/PdfTsMain.vue'
import TermsManager from '@/renderer/components/pdftranslate/TermsManager.vue'
import TranslateHistory from '@/renderer/components/pdftranslate/TranslateHistory.vue'
import OcrRec from '@/renderer/components/pdftranslate/ocr/OcrRec.vue'
import OcrHistory from '@/renderer/components/pdftranslate/ocr/OcrHistory.vue'
// 导入组件DownloadComponent
import DownloadComponent from '@/renderer/components/update/DownloadComponent.vue'
// 定义组件映射
type ViewComponent = DefineComponent<{}, {}, any>
const functionComponents: Record<string, Component> = {
  main: PdfTsMain as ViewComponent,
  history: TranslateHistory as ViewComponent,
  ocrrec: OcrRec as ViewComponent,
  ocrhistory: OcrHistory as ViewComponent
}
const settingsComponents = {
  terms: TermsManager as ViewComponent
}
const activeFunctionKey = ref<keyof typeof functionComponents>('main')
const activeSettingsKey = ref<keyof typeof settingsComponents>('terms')
const activeFunctionComponent = shallowRef(functionComponents[activeFunctionKey.value])
const activeSettingsComponent = shallowRef(settingsComponents[activeSettingsKey.value])
const activeTab = ref<'function' | 'settings'>('function')

const handleSidebarSelect = (key: string, type: 'function' | 'settings') => {
  activeTab.value = type // 新增这行来切换当前激活的标签页
// 新增强制刷新组件逻辑
nextTick(() => {
    if (type === 'function') {
      activeFunctionKey.value = key as keyof typeof functionComponents
      activeFunctionComponent.value = functionComponents[key as keyof typeof functionComponents]
    } else {
      activeSettingsKey.value = key as keyof typeof settingsComponents
      activeSettingsComponent.value = settingsComponents[key as keyof typeof settingsComponents]
    }
  })
}
</script>

<style scoped>
/* 基础样式 */
.n-layout-sider {
  height: 100%;
}
.n-layout-content {
  padding: 24px;
}
</style>