<template>
  <n-layout has-sider>
    <n-layout-sider
      collapse-mode="width"
      :collapsed-width="1"
      :width="300"
      :show-collapsed-content=true
      show-trigger
      bordered
    >
      <MainChatLeftSide 
       @selectChat = "selectChat"/>
    </n-layout-sider>
    <n-layout-content>
      <MainChatContent :chatId="chatId" :chatName="chatName"/>
    </n-layout-content>
  </n-layout>
</template>

<script lang="ts" setup>
import { NLayout, NLayoutSider, NLayoutContent } from 'naive-ui'
import MainChatLeftSide from '@/renderer/components/mainchat/MainChatLeftSide.vue' 
import MainChatContent from '@/renderer/components/mainchat/MainChatContent.vue' 
import { ref } from 'vue'
const chatId = ref('')
const chatName = ref('')

const selectChat = (chatId:string, chatName:string) => {
  console.log('selectChat', chatId, chatName)
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