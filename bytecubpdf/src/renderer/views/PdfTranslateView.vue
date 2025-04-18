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
        :active="activeKey" 
        @select="handleSidebarSelect"
      />
    </n-layout-sider>
    <n-layout-content>
      <keep-alive include="PdfTsMain">
        <component :is="activeComponent" />
      </keep-alive>
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { ref, shallowRef,type Component } from 'vue'
import type { DefineComponent } from 'vue'
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import PdfTsLeftSide from '@/renderer/components/pdftranslate/PdfTsLeftSide.vue' 
import PdfTsMain from '@/renderer/components/pdftranslate/PdfTsMain.vue'
import TranslateHistory from '@/renderer/components/pdftranslate/TranslateHistory.vue'
// 定义组件映射
type ViewComponent = DefineComponent<{}, {}, any>
const components: Record<string, Component> = {
  main: PdfTsMain as ViewComponent,
  history: TranslateHistory as ViewComponent
}

const activeComponent = shallowRef(components.main)

// 新增activeKey管理
const activeKey = ref<keyof typeof components>('main')

const handleSidebarSelect = (key: keyof typeof components) => {
  activeKey.value = key
  activeComponent.value = components[key]
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