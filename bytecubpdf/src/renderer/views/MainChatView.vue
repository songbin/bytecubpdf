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
      <MainChatLeftSide/>
    </n-layout-sider>
    <n-layout-content>
      <MainChatContent></MainChatContent>
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import MainChatLeftSide from '@/renderer/components/mainchat/MainChatLeftSide.vue' 
import MainChatContent from '@/renderer/components/mainchat/MainChatContent.vue' 

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