<template>
   
    <n-layout has-sider>
      <n-layout-sider 
        collapse-mode="width"
        :width="240"
        :show-collapsed-content=false
        bordered>
        <AssistantLeftSide  
        @edit-assistant="handleEditAssistant"
        :key = "sideKey"/>
      </n-layout-sider>
      
      <n-layout-content>
        <AssistantSettingsContent 
          :id="assistantId"
          :contentKey = "contentKey"
        />
      </n-layout-content>
    </n-layout>
 
</template>
  
<script lang="ts" setup>
  defineOptions({
    name: 'AssistantSettings'
  })
  
  import { ref,watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { NLayout, NLayoutSider, NLayoutContent, NIcon } from 'naive-ui'
  import AssistantLeftSide from '@/renderer/components/settings/assistant/AssistantLeftSide.vue'
  import AssistantSettingsContent from '@/renderer/components/settings/assistant/AssistantSettingsContent.vue'
  const route = useRoute()
  const assistantId = ref<number | undefined>(undefined)
  const contentKey = ref(0)
  const sideKey = ref(0) // 用于强制刷新左侧菜单
 
  const handleEditAssistant = async (id: number) => {
    assistantId.value = id
    contentKey.value = contentKey.value + 1
  }
 
  // 监听路由参数变化
//   watch(() => route.params.assistantId, (newId) => {
//     assistantId.value = newId as string | undefined
//     console.log('路由参数变化:', newId)
//     if (newId) {
//       handleEditAssistant(newId as string)
//     }
//   })

  // 初始化时如果有参数，直接编辑
  if (assistantId.value) {
    handleEditAssistant(assistantId.value)
  }
 
   
</script>