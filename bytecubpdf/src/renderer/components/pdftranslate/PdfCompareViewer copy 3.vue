<script lang="ts" setup>
import VuePdfEmbed from 'vue-pdf-embed'
import { ref, watch, onMounted, nextTick, shallowRef, onBeforeUnmount } from 'vue'
import {   NButton,
  NSpace,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NInputNumber,NSpin,NSwitch } from 'naive-ui'

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
const pageCount = ref<number>(0)
const page = ref<number|undefined>(1)
const leftLoading = ref<boolean>(true)
const rightLoading = ref<boolean>(true)
const showAllPages = ref<boolean>(false)
const containerWidth = ref(0);
const containerHeight = ref(0);
const pdfLeftContainer = ref<HTMLElement | null>(null);
const emit = defineEmits(['close'])

const updateDimensions = () => {
  if (pdfLeftContainer.value) {
    containerWidth.value = pdfLeftContainer.value.offsetWidth;
    containerHeight.value = pdfLeftContainer.value.offsetHeight;
  }
};

// 初始化并监听容器尺寸变化
onMounted(() => {
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      updateDimensions();
    }
  });
  if (pdfLeftContainer.value) {
    observer.observe(pdfLeftContainer.value);
    updateDimensions(); // 初始计算
  }
  // 监听窗口变化
  window.addEventListener('resize', updateDimensions);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDimensions);
});

const toggleFullscreen = async () => {
  try {
    console.log('最大化窗口');
    await (window as any).window.electronAPI?.maximizeWindow();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
}
const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
  pageCount.value = numPages
}

const handleLeftRender = () => {
  leftLoading.value = false
  console.log('left page:', page.value)
}

const handleRightRender = () => {
  rightLoading.value = false
  console.log('right page:', page.value)
}
</script>

<template>
  <n-layout>
    <n-layout-header class="app-header">
      <n-space justify="end" :style="{ padding: '10px' }">
        <n-button size="small" type="success" @click="emit('close')">退出阅读</n-button>
        <n-button size="small" type="success" @click="toggleFullscreen">全屏(还原)窗口</n-button>
      </n-space>
    </n-layout-header>

    <n-layout-content class="pdf-compare-container">
      <div ref="pdfLeftContainer" class="app-content left-pane">
        <n-spin :show="leftLoading">
          <vue-pdf-embed
            :source="props.filePathLeft"
            :page="page"
            annotation-layer
            text-layer
            :width="containerWidth"
            :height="containerHeight"
            @loaded="handleDocumentLoad"
            @rendered="handleLeftRender"
          />
        </n-spin>
      </div>
      <div ref="pdfRightContainer" class="app-content right-pane">
        <n-spin :show="rightLoading">
          <vue-pdf-embed
            :source="props.filePathRight"
            :page="page"
            annotation-layer
            text-layer
            :width="containerWidth"
            :height="containerHeight"
            @loaded="handleDocumentLoad"
            @rendered="handleRightRender"
          />
        </n-spin>
      </div>
    </n-layout-content>
    <!-- 底部控制栏 -->
    <n-layout-footer   bordered style="flex-shrink: 0">
      <n-space justify="center" align="center" style="width: 100%; padding: 10px;">
        <n-button :disabled="page! <= 1" @click="page!--">❮ 上一页</n-button>
        <span v-if="!showAllPages">{{ page }} / {{ pageCount }}</span>
        <n-button :disabled="page! >= pageCount" @click="page!++">下一页 ❯</n-button>
        <n-switch v-model:value="showAllPages">
          <template #checked>
            全部展开
          </template>
          <template #unchecked>
            分页阅读
          </template>
        </n-switch>
      </n-space>
    </n-layout-footer>
  </n-layout>
</template>

<style scoped>
.pdf-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #555;
  color: #ddd;
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.1);
}

.navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

 
.app-content { 
  padding: 24px 16px;
  width: 48%;
}

.pdf-compare-container {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: auto;
}

.left-pane,
.right-pane {
  flex: 1;
  min-width: 400px;
  border-right: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* :deep(.n-spin-container) {
  height: 100%;
  width: 100%;
}

:deep(.n-spin-content) {
  opacity: 0.8;
} */
</style>