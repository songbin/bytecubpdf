<template>
   
    <n-layout has-sider>
      <n-layout-sider 
        collapse-mode="width"
        :width="240"
        :show-collapsed-content=false
        bordered>
        <ModelLeftSide  
        @edit-platform="handleEditPlatform"
        :key = "sideKey"/>
      </n-layout-sider>
      
      <n-layout-content>
        <ModelSettingsContent 
          :platform-id="platformId"
          :is-new="isNewPlatform"
          :contentKey = "contentKey"
        />
      </n-layout-content>
    </n-layout>
 
</template>
  
  <script lang="ts" setup>
  defineOptions({
    name: 'ModelSettings'
  })
  
  import { ref,watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { NLayout, NLayoutSider, NLayoutContent, NIcon } from 'naive-ui'
  import ModelLeftSide from '@/renderer/components/settings/modelsettings/ModelLeftSide.vue'
  import ModelSettingsContent from '@/renderer/components/settings/modelsettings/ModelSettingsContent.vue'
  const route = useRoute()
  const platformId = ref<string | undefined>(route.params.platformId as string | undefined)
 
  const isNewPlatform = ref(false)
  const contentKey = ref(0)
  const sideKey = ref(0) // 用于强制刷新左侧菜单
  // 平台ID，用于标识当前编辑的平台，当平台编辑内容页从新增到编辑时，需要更新左侧平台列表(新增保存后就变成编辑了)
  // const platformId = ref<string | undefined>(undefined)
 
  const handleEditPlatform = async (id: string) => {
    platformId.value = id
    isNewPlatform.value = false
    contentKey.value = contentKey.value + 1
  }
 
  // 监听路由参数变化
  watch(() => route.params.platformId, (newId) => {
    platformId.value = newId as string | undefined
    console.log('路由参数变化:', newId)
    if (newId) {
      handleEditPlatform(newId as string)
    }
  })

  // 初始化时如果有参数，直接编辑
  if (platformId.value) {
    handleEditPlatform(platformId.value)
  }
 
   
</script>