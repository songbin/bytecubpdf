<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <Layout>
          <router-view />
        </Layout>
        <!-- ✨ 优化：使用Suspense延迟加载版本升级组件 -->
        <Suspense>
          <template #default>
            <VersionUpgrade v-if="showVersionUpgrade" />
          </template>
          <template #fallback>
            <!-- 加载中不显示任何内容，避免白屏 -->
            <div style="display: none;"></div>
          </template>
        </Suspense>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
  import { ref, onMounted, defineAsyncComponent } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { NMessageProvider, NDialogProvider, NConfigProvider } from 'naive-ui'

  // ✨ 改为异步组件导入
  const Layout = defineAsyncComponent(() => import('@/renderer/layout/Layout.vue'))
  const VersionUpgrade = defineAsyncComponent(() =>
    import('@/renderer/components/VersionUpgrade.vue')
  )

  // ✨ 延迟显示版本升级组件
  const showVersionUpgrade = ref(false)

  // 添加try-catch处理i18n初始化错误
  try {
    const { t } = useI18n()
  } catch (e) {
    console.error('i18n init failure:', e)
  }

  onMounted(() => {
    console.log('App mounted')

    // ✨ 延迟1秒后再加载版本升级组件
    // 这样首屏渲染可以更快完成
    setTimeout(() => {
      showVersionUpgrade.value = true
      console.log('✅ [按需加载] 版本升级组件已加载')
    }, 1000)
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