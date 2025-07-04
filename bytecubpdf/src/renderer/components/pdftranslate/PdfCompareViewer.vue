<script lang="ts" setup>
defineOptions({
  name: 'PdfCompareViewer'
})

import VuePdfEmbed from 'vue-pdf-embed'
import { ref, watch, onMounted, nextTick, shallowRef, onBeforeUnmount } from 'vue'
import {
  NButton,
  NSpace,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NInputNumber, NSpin, NSwitch
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
const pageCount = ref<number>(0)
const page = ref<number | undefined>(1)
const isLoading = ref<boolean>(true)
const showAllPages = ref<boolean>(false)
const containerLeftWidth = ref(0);
const containerRightWidth = ref(0);
const containerLeftHeight = ref(0);
const containerRightHeight = ref(0);
const leftPdfContainer = ref<HTMLElement | null>(null);
const rightPdfContainer = ref<HTMLElement | null>(null);
const leftLoading = ref<boolean>(true)
const rightLoading = ref<boolean>(true)
let leftObserver: ResizeObserver | null = null;
  let rightObserver: ResizeObserver | null = null;
const emit = defineEmits(['close'])
 

const updateLeftDimensions = () => {
  if (leftPdfContainer.value) {
    containerLeftWidth.value = leftPdfContainer.value.offsetWidth;
    containerLeftHeight.value = leftPdfContainer.value.offsetHeight;
  }
};

const updateRightDimensions = () => {
  if (rightPdfContainer.value) {
    containerRightWidth.value = rightPdfContainer.value.offsetWidth;
    containerRightHeight.value = rightPdfContainer.value.offsetHeight;
  }
};
watch(showAllPages, (newVal, oldVal) => {
  // 监听变化后的处理逻辑
  console.log('showAllPages changed:', newVal);
  page.value = showAllPages.value ? undefined : 1
  leftLoading.value = true
  rightLoading.value = true
});
watch(page, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    leftLoading.value = true
    rightLoading.value = true
  }
})

onMounted(() => {
  leftObserver = new ResizeObserver(updateLeftDimensions);
  rightObserver = new ResizeObserver(updateRightDimensions);
  
  if (leftPdfContainer.value) leftObserver.observe(leftPdfContainer.value);
  if (rightPdfContainer.value) rightObserver.observe(rightPdfContainer.value);
  
  updateLeftDimensions();
  updateRightDimensions();
});

 

onBeforeUnmount(() => {
  leftObserver?.disconnect();
  rightObserver?.disconnect();
});
const handleLeftRender = () => {
  leftLoading.value = false
  console.log('left page:', page.value)
}

const handleRightRender = () => {
  rightLoading.value = false
  console.log('right page:', page.value)
}
const toggleFullscreen = async () => {
  try {
    console.log('最大化窗口');
    await (window as any).window.electronAPI?.maximizeWindow();
    leftLoading.value = true
    rightLoading.value = true
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
}
const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
  pageCount.value = numPages
}

const handleDocumentRender = () => {
  isLoading.value = false
  console.log('page:', page.value)
  // page.value = undefined
  // showAllPages.value = false
}


</script>

<template>

  <div class="app-header">
    <n-space justify="end" :style="{ padding: '5px', 'flex-wrap': 'nowrap' }">
      <n-button size="small" type="success" @click="emit('close')">退出阅读</n-button>
      <n-button size="small" type="success" @click="toggleFullscreen">全屏(还原)窗口</n-button>
    </n-space>
  </div>
  <div class="pdf-compare-container">
    <div ref="leftPdfContainer" class="app-content left-panel">
      <n-spin :show="leftLoading">
      <vue-pdf-embed :source="props.filePathLeft" :page="page" annotation-layer text-layer :width="containerLeftWidth"
        :height="containerLeftHeight" @loaded="handleDocumentLoad" @rendered="handleLeftRender" />
      </n-spin>
    </div>
    <div ref="rightPdfContainer" class="app-content right-pane">
      <n-spin :show="rightLoading">
      <vue-pdf-embed :source="props.filePathRight" :page="page" annotation-layer text-layer :width="containerRightWidth"
        :height="containerRightHeight"  @rendered="handleRightRender" />
        </n-spin>
    </div>
  </div>
 
  <div class="app-footer">
    <n-space justify="center" :style="{ padding: '5px', 'flex-wrap': 'nowrap' }">
      <span v-if="!showAllPages"  >
        <n-button size="small" type="success" :disabled="page! <= 1" @click="page!--">❮ 上一页</n-button>
        <!-- <n-input-number v-model:value="page" :min="1" :max="pageCount" size="small" /> -->
       {{ page }} / {{ pageCount }}
        <n-button size="small"  type="success"   :disabled="page! >= pageCount" @click="page!++">下一页 ❯</n-button>
        <n-input-number 
          v-model:value="page"
          :min="1"
          :max="pageCount"
          size="small"
          style="width: 140px; margin: 0 8px;
          display: inline-block"
          placeholder="跳转到"
        >
        <template #prefix>
          转跳页码:
          </template>
        </n-input-number>
      </span>
      <n-switch v-model:value="showAllPages">
        <template #checked>单页模式</template>
        <template #unchecked>全页模式</template>
      </n-switch>
    </n-space>
  </div>
</template>
<style scoped>
.app-header {

  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.1);
  background-color: #555;
  color: #ddd;
}

.app-header>* {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-content {
  padding: 24px 12px;
  width: 48%;
}

.vue-pdf-embed {
  margin: 0 auto;
}

.vue-pdf-embed__page {
  margin-bottom: 8px;
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.1);
}

.pdf-compare-container {
  display: flex;
  gap: 16px;
  width: 100%;
  height: calc(100vh - 80px); /* 减去头部和底部高度 */
  margin-top: 40px; /* 头部高度 */
  overflow: auto;
}
.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fefdfd;
  box-shadow: 0 -2px 8px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
.left-pane,
.right-pane {
  flex: 1;
  border-right: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}


:deep(.n-spin-container) {
  height: 100%;
  width: 100%;
}

:deep(.n-spin-content) {
  opacity: 0.8;
} 
</style>