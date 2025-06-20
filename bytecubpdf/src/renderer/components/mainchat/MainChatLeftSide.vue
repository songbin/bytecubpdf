<script setup lang="ts">
import { ref } from 'vue'
import { Conversations } from 'vue-element-plus-x'
import type { ConversationItem, ConversationMenuCommand } from 'vue-element-plus-x/types/Conversations'
import { useMessage, NTabs, NTabPane, NButton, NIcon, NFlex, NInput, NInputGroup } from 'naive-ui'
import { AddComment, SearchLocate } from '@vicons/carbon'
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

  {
    key: 'm15',
    label: '菜单测试项目 13',
  },
  {
    key: 'm16',
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
  <div>
    <n-tabs type="segment" animated>
      <n-tab-pane name="function" tab="聊天历史">
        <div style="display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 120px);">
          <Conversations v-model:active="activeKey4" :items="menuTestItems" :label-max-width="160" :show-tooltip="true"
            row-key="key" tooltip-placement="right" :tooltip-offset="35" show-to-top-btn show-built-in-menu
            @menu-command="handleMenuCommand">
            <template #header>
              <n-flex vertical>
                <n-button size="small">
                  <template #icon>
                    <n-icon>
                      <AddComment />
                    </n-icon>
                  </template>
                  新建对话
                </n-button>
                <n-input-group>

                  <n-input round type="text" size="small" placeholder="根据会话名搜索">
                    <template #prefix>
                      <n-icon :component="SearchLocate" />
                    </template>
                  </n-input>
                  <n-button type="primary" size="small">
                    搜索
                  </n-button>
                </n-input-group>

              </n-flex>

            </template>
          </Conversations>
        </div>
      </n-tab-pane>
      <n-tab-pane name="settings" tab="设置">
        设置区域
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped lang="less"></style>