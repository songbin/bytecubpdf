<script setup lang="ts">
import {ref} from 'vue'
import type { ConversationItem, ConversationMenuCommand } from 'vue-element-plus-x/types/Conversations'
import { useMessage } from 'naive-ui'
const message = useMessage()
const menuTestItems = ref([
  {
    key: 'm1',
    label: '菜单测试项目 1 - 长文本效果演示文本长度溢出效果测试'.repeat(2),
  },
  {
    key: 'm2',
    label: '菜单测试项目 2',
    disabled: true,
  },
  {
    key: 'm3',
    label: '菜单测试项目 3',
  },
  {
    key: 'm4',
    label: '菜单测试项目 4',
  },
  {
    key: 'm5',
    label: '菜单测试项目 5',
  },
  {
    key: 'm6',
    label: '菜单测试项目 6',
  },
  {
    key: 'm7',
    label: '菜单测试项目 7',
  },
  {
    key: 'm8',
    label: '菜单测试项目 8',
  },
  {
    key: 'm9',
    label: '菜单测试项目 9',
  },
  {
    key: 'm10',
    label: '菜单测试项目 10',
  },
  {
    key: 'm11',
    label: '菜单测试项目 11',
  },
  {
    key: 'm12',
    label: '菜单测试项目 12',
  },
  {
    key: 'm13',
    label: '菜单测试项目 13',
  },
  {
    key: 'm14',
    label: '菜单测试项目 14',
  },
])

const activeKey4 = ref('m1')

// 内置菜单点击方法
function handleMenuCommand(command: ConversationMenuCommand, item: ConversationItem) {
  console.log('内置菜单点击事件：', command, item)
  // 直接修改 item 是否生效
  if (command === 'delete') {
    const index = menuTestItems.value.findIndex(itemSlef => itemSlef.key === item.key)

    if (index !== -1) {
      menuTestItems.value.splice(index, 1)
      console.log('删除成功')
      message.success('删除成功')
    }
  }
  if (command === 'rename') {
    item.label = '已修改'
    console.log('重命名成功')
    message.success('重命名成功')
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; height: 420px;">
    <Conversations
      v-model:active="activeKey4"
      :items="menuTestItems"
      :label-max-width="200"
      :show-tooltip="true"
      row-key="key"
      tooltip-placement="right"
      :tooltip-offset="35"
      show-to-top-btn
      show-built-in-menu
      @menu-command="handleMenuCommand"
    />
  </div>
</template>

<style scoped lang="less">
</style>