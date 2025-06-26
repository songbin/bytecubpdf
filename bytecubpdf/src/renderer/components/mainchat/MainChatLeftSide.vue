<script setup lang="ts">
import { ref,onMounted } from 'vue'
import { Conversations } from 'vue-element-plus-x'
import type { ConversationItem, ConversationMenuCommand } from 'vue-element-plus-x/types/Conversations'
import { useMessage, NTabs, NTabPane, NButton, NIcon, NFlex, NInput, NInputGroup ,NModal} from 'naive-ui'
import { AddComment, SearchLocate } from '@vicons/carbon'
import { ChatModel } from '@/renderer/model/chat/ChatMessage'
import { ChatStorageService } from '@/renderer/service/chat/ChatStorageService'
const message = useMessage()
const chatList = ref<ChatModel[]>([])
const chatStorageService:ChatStorageService = new ChatStorageService()
const activeChatId = ref('')
const showCreateChat = ref(false)
const newChatName = ref('')

// 内置菜单点击方法
function handleMenuCommand(command: ConversationMenuCommand, item: ConversationItem) {
  
  // 直接修改 item 是否生效
  if (command === 'delete') {
    const index = chatList.value.findIndex(chatItem => chatItem.id === item.id)

    if (index !== -1) {
      chatStorageService.deleteChatHistory(item.id)
      chatList.value.splice(index, 1)
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
const openCreateChatDialog = () => {
    showCreateChat.value = true
}
const directCreateChat = async () =>{
    const chat: ChatModel | null = await chatStorageService.createChat('新建聊天')
    if(null == chat){
      message.error('创建失败，请重试')
      return
    }
    chatList.value.unshift(chat)
    activeChatId.value = chat.id
}
const createChat = async () =>{
  if(newChatName.value === ''){
    message.error('请输入聊天名字')
    return
  }
  const chat: ChatModel | null = await chatStorageService.createChat(newChatName.value)
  if(null == chat){
    message.error('创建失败，请重试')
    return
  }
  chatList.value.unshift(chat)
  newChatName.value = ''
  showCreateChat.value = false
  activeChatId.value = chat.id
}

const loadData = async () =>{
  const list = await chatStorageService.getChatHistoryPage();
  chatList.value = list;
}
onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div>
    <n-tabs type="segment" animated>
      <n-tab-pane name="function" tab="聊天历史">
        <div style="display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 120px);">
          <Conversations 
            v-model:active="activeChatId" 
            :items="chatList" 
            :label-max-width="160" 
            :show-tooltip="true"
            row-key="id" 
            tooltip-placement="right" 
            :tooltip-offset="35" show-to-top-btn show-built-in-menu
            @menu-command="handleMenuCommand">
            <template #header>
              <n-flex vertical>
                <n-button size="small" @click="directCreateChat">
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

     <n-modal v-model:show="showCreateChat" preset="dialog" title="创建聊天">
     
      <n-input v-model:value="newChatName" size="small" placeholder="输入聊天名字"></n-input>
      <template #action>
        <n-button type="success" @click="createChat">创建</n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped lang="less"></style>