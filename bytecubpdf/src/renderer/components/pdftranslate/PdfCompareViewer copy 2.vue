<script lang="ts" setup>
import VuePdfEmbed from 'vue-pdf-embed'
import { ref, onMounted, nextTick, shallowRef, onBeforeUnmount } from 'vue'
import {
  NButton,
  NSpace,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NInputNumber
} from 'naive-ui'
// optional styles
import 'vue-pdf-embed/dist/styles/annotationLayer.css'
import 'vue-pdf-embed/dist/styles/textLayer.css'
interface Props {
  filePathLeft: string
  filePathRight: string
  title?: string
  scale?: number
}
// either URL, Base64, binary, or document proxy
const props = withDefaults(defineProps<Props>(), {
  title: 'PDF 阅读器',
  scale: 100
})
const emit = defineEmits(['close'])
const toggleFullscreen = async () => {
  try {
    console.log('最大化窗口');
    await (window as any).window.electronAPI?.maximizeWindow();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
}
</script>

<template>
 
  <n-layout class="pdf-compare-modal" position="absolute" style="height: 100vh;">
    <!-- 头部区域 -->
    <n-layout-header bordered style="background-color: #f5f5f5">
      <n-space justify="end" :style="{ padding: '10px' }">
        <n-button size="small" type="success" @click="emit('close')">退出阅读</n-button>
        <n-button size="small" type="success" @click="toggleFullscreen">全屏(还原)窗口</n-button>
      </n-space>
    </n-layout-header>
    <!-- 内容区域 -->
    <n-layout-content ref="contentRef" style="flex: 1; min-height: 0; position: relative; z-index: 2000;">

      <!-- PDF显示区域 -->
      <div class="pdf-container">
        <div class="pdf-columns">
          <!-- 左侧 PDF 显示 -->
          <div class="pdf-column" ref="leftContainer" >
            <div v-if="filePathLeft" class="canvas-container">
              <VuePdfEmbed annotation-layer text-layer :source="props.filePathLeft" />
            </div>
            <div v-else class="empty">
              <p>左侧 PDF 未加载</p>
            </div>
          </div>

          <!-- 右侧 PDF 显示 -->
          <div class="pdf-column" ref="rightContainer"  >
            <div v-if="filePathRight" class="canvas-container">
              <VuePdfEmbed annotation-layer text-layer :source="props.filePathRight" />
            </div>
            <div v-else class="empty">
              <p>右侧 PDF 未加载</p>
            </div>
          </div>
        </div>
      </div>
    </n-layout-content>

    <!-- 底部控制栏 -->
    <n-layout-footer   bordered style="flex-shrink: 0">
      <n-space justify="center" align="center" style="width: 100%; padding: 10px;">
        <n-button>上一页</n-button>
         
        <n-button >下一页</n-button>
        <n-input-number  />
        <n-button >跳转</n-button>

      </n-space>
    </n-layout-footer>
  </n-layout>
 
</template>
<style scoped>
n-layout-header {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 2000;
  background: white;
}

.pdf-compare-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: white;
  isolation: isolate;
}

.pdf-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.pdf-columns {
  display: flex;
  gap: 10px;
  padding: 10px;
  height: calc(100% - 50px);
  box-sizing: border-box;
}

.pdf-column {
  flex: 1;
  overflow-y: auto;
  height: 100%;
  border: 1px solid #eee;
  background: #f9f9f9;
  border-radius: 4px;
  position: relative;
}

.canvas-container {
  position: relative;
  display: inline-block;
}

.pdf-canvas {
  display: block;
  margin: 0 auto;
  width: 100% !important;
  height: auto !important;
}

/* 文本层容器样式 */
 

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}
</style>