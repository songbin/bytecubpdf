<script setup lang="ts">
defineOptions({
  name: 'MainChatLeftSide'
})

import { ref,onMounted } from 'vue'
import { Conversations } from 'vue-element-plus-x'
import type { ConversationItem, ConversationMenuCommand } from 'vue-element-plus-x/types/Conversations'
import { useMessage, NTabs, NTabPane, NButton, NIcon, NFlex, NInput, NInputGroup ,NModal} from 'naive-ui'
import { AddComment, SearchLocate } from '@vicons/carbon'
import { ChatModel } from '@/renderer/model/chat/ChatMessage'
import { chatStorageService } from '@/renderer/service/chat/ChatStorageService'
const message = useMessage()
const chatList = ref<ChatModel[]>([]) 
const activeChatId = ref('')
const searchValue = ref('')

const showCreateChat = ref(false)
const newChatName = ref('')
const showRenameChat = ref(false)
const chatId = ref('') //当前正在操作的chatid
const current_page = ref(1)
const page_size = ref(20)
const isLoading = ref(false)
const emit = defineEmits<{
  (e: 'selectChat', chatId: string, chatName: string): void
}>()
function handleChange(item: ConversationItem<ChatModel>) {
  const label = item.label ?? ''
  emit('selectChat', item.id, label)
}
const submitChatChange = async (chatId:string, chatName:string) =>{
  emit('selectChat', chatId, chatName)
}
// 内置菜单点击方法
function handleMenuCommand(command: ConversationMenuCommand, item: ChatModel) {
  
  // 直接修改 item 是否生效
  if (command === 'delete') {
    const index = chatList.value.findIndex(chatItem => chatItem.id === item.id)

    if (index !== -1) {
      chatStorageService.deleteChatHistory(item.id)
      chatList.value.splice(index, 1)
      submitChatChange('', '')
     
      message.success('删除成功')
    }
  }
  if (command === 'rename') {
    showRenameChat.value = true
    chatId.value = item.id
    newChatName.value = item.label ?? ''
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
    await loadData()
     
    submitChatChange(chat.id, chat.label ?? '')
    activeChatId.value = chat.id
}
const renameChat = async () =>{
  if(newChatName.value === ''){
    message.error('请输入聊天名字')
    return
  }
  await chatStorageService.updateChatHistoryName(chatId.value, newChatName.value)
  await loadData()
  newChatName.value = ''
  showRenameChat.value = false
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
  await loadData()
  newChatName.value = ''
  showCreateChat.value = false
  activeChatId.value = chat.id
}

const loadData = async () =>{
  current_page.value = 1
  const list = await chatStorageService.getChatHistoryPage(searchValue.value, current_page.value, page_size.value);
  chatList.value = list;
}
const loadMore = async () =>{
  current_page.value++
  const list = await chatStorageService.getChatHistoryPage(searchValue.value, current_page.value, page_size.value)
  if(list.length === 0){
    message.info('没有更多数据了')
    return
  }
  chatList.value = chatList.value.concat(list)
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
            :label-max-width="180" 
            :show-tooltip="true"
            row-key="id" 
            tooltip-placement="right" 
            :tooltip-offset="35" show-to-top-btn show-built-in-menu
            :load-more="loadMore"
            :load-more-loading="isLoading"
            @change="handleChange"
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

                  <n-input  round type="text" size="small" clearable v-model:value="searchValue" placeholder="根据会话名搜索">
                    <template #prefix>
                      <n-icon :component="SearchLocate" />
                    </template>
                  </n-input>
                  <n-button type="primary" size="small" @click="loadData">
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

    <n-modal v-model:show="showRenameChat" preset="dialog" title="改名">
        <n-input v-model:value="newChatName" size="small" placeholder="输入聊天名字"></n-input>
        <template #action>
          <n-button type="success" @click="renameChat">确认</n-button>
        </template>
    </n-modal>
  </div>
</template>

<style scoped lang="less"></style>