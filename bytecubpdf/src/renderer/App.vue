<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <Layout>
          <router-view />
            <!-- <router-view v-slot="{ Component }">
              <keep-alive>
                <component :is="Component" v-if="$route.meta.keepAlive" />
              </keep-alive>
              <component :is="Component" v-if="!$route.meta.keepAlive" />
            </router-view> -->
        </Layout>
        <VersionUpgrade />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
  import { useI18n } from 'vue-i18n'
  import { onMounted } from 'vue'
  import VersionUpgrade from '@/renderer/components/VersionUpgrade.vue'
  import { NMessageProvider,NDialogProvider,NConfigProvider } from 'naive-ui'
  import Layout from '@/renderer/layout/Layout.vue'
  

  // 添加try-catch处理i18n初始化错误
  try {
    const { t } = useI18n()
  } catch (e) {
    console.error('i18n init failure:', e)
  }
  onMounted(() => {
    console.log('App mounted')
  })
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>