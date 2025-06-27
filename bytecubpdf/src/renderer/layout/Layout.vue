<template>
  <div class="app-container">
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <!-- 上部分 -->
      <div class="sidebar-top">
        <div class="logo-container" >
          <img :src="logo" alt="Logo" class="logo">
        </div>
        
        <div class="side-center-container">
          <FuncSide />
        </div>
      </div>
      <!-- 下部分 -->
      <div class="sidebar-bottom">
        <div class="side-center-container">
          <SettingsSide />
        </div>
      </div>
    </div>
    
    <!-- 右侧内容区 -->
    <div class="right-content">
      <!-- 顶部标题栏 -->
      <div class="title-bar">
        <TopSide />
      </div>
      
      <!-- 主内容区域 -->
      <div class="main-content">
        <n-flex>
          <slot />
        </n-flex>
      </div>
    </div>
      <DlTranslateResourceModal 
        :filesToDownload= filesToDownload
       />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue' 
import { NFlex, NButton, NSpace, NIcon } from 'naive-ui'
import FuncSide from './FuncSide.vue'
import SettingsSide from './SettingsSide.vue'
import TopSide from './TopSide.vue'
import logo from '@/renderer/assets/images/docfable.png'
// 导入组件DownloadComponent
import DlTranslateResourceModal from '@/renderer/components/download/DlTranslateResourceModal.vue'
import { FileDownloadItem,DownloadProgress } from '@/shared/constants/dfconstants';
const filesToDownload = ref<FileDownloadItem[]>([])
onMounted( async() => {
  if ((window as any).window.electronAPI) {
    console.log('当前平台:', (window as any).window.electronAPI.platform)
  } else {
    console.warn('Electron API 不可用')
  }
   filesToDownload.value = await (window as any).window.electronAPI.verifyFileDownloads();
})


</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  background-color: #f5f5f5;
}
.logo-container {
  margin: 0;
  padding: 0;
}
.side-center-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  width: 100%;
}
.logo {
  width: 50px;
  height: 64px;
  object-fit: contain;
  display: block; /* 确保图片作为块级元素显示 */
}
.sidebar {
  width: 55px;
  height: 100vh !important; /* 强制全屏高度 */
  display: flex;
  flex-direction: column;
  background-color: #f0f0f0;
  position: relative; /* 为绝对定位子元素提供参照 */
}

.sidebar-top {
  flex: 0 0 80%; /* 固定高度比例 */
  overflow-y: auto;
}

.sidebar-bottom {
  flex: 0 0 20%;
  overflow-y: auto;
  position: absolute; /* 绝对定位到容器底部 */
  bottom: 0;
  left: 0;
  right: 0;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 解决flex容器收缩问题 */
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f0f0f0;
  color: #333333;
  -webkit-app-region: drag;
  user-select: none;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #ffffff;
  border-radius: 8px; /* 添加圆角 */
  /* margin: 8px; 添加边距让圆角可见 */
}
</style>