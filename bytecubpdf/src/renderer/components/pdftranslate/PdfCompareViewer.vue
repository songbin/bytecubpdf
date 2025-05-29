<template>
  <!-- 使用 Naive UI 布局容器 -->
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
          <div class="pdf-column" ref="leftContainer" @scroll="syncScroll('left')">
            <div v-if="filePathLeft" class="canvas-container">
              <canvas ref="leftCanvas" class="pdf-canvas"></canvas>
              <div class="text-layer" ref="leftTextLayer"></div>
            </div>
            <div v-else class="empty">
              <p>左侧 PDF 未加载</p>
            </div>
          </div>

          <!-- 右侧 PDF 显示 -->
          <div class="pdf-column" ref="rightContainer" @scroll="syncScroll('right')">
            <div v-if="filePathRight" class="canvas-container">
              <canvas ref="rightCanvas" class="pdf-canvas"></canvas>
              <div class="text-layer" ref="rightTextLayer"></div>
            </div>
            <div v-else class="empty">
              <p>右侧 PDF 未加载</p>
            </div>
          </div>
        </div>
      </div>
    </n-layout-content>

    <!-- 底部控制栏 -->
    <n-layout-footer v-if="totalPagesLeft > 0 || totalPagesRight > 0" bordered style="flex-shrink: 0">
      <n-space justify="center" align="center" style="width: 100%; padding: 10px;">
        <n-button @click="changePage('both', 'prev')"
          :disabled="currentPageLeft <= 1 && currentPageRight <= 1">上一页</n-button>
        <span>{{ Math.max(currentPageLeft, currentPageRight) }} / {{ Math.max(totalPagesLeft, totalPagesRight) }}</span>
        <n-button @click="changePage('both', 'next')"
          :disabled="currentPageLeft >= totalPagesLeft && currentPageRight >= totalPagesRight">下一页</n-button>
        <n-input-number v-model:value="jumpPage" :min="1" :max="Math.max(totalPagesLeft, totalPagesRight)"
          style="width: 80px" @keyup.enter="jumpToPage" />
        <n-button @click="jumpToPage">跳转</n-button>

      </n-space>
    </n-layout-footer>
  </n-layout>
</template>

<script lang="ts">
// 扩展 Window 接口以包含 pdfjsLib
declare global {
  interface Window {
    pdfjsLib?: typeof import('pdfjs-dist');
  }
}
</script>

<script lang="ts" setup>
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
import 'pdfjs-dist/web/pdf_viewer.css'

// 修复：确保 legacy 模块能访问全局 pdfjsLib
import * as pdfjsLib from "pdfjs-dist";

// 设置全局变量
// window.pdfjsLib = pdfjsLib;

// 现在导入 viewer 模块
import { TextLayerBuilder  } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

// 配置 pdfjs-dist 的 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).href;

 
interface Props {
  filePathLeft: string
  filePathRight: string
  title?: string
  scale?: number
}

const emit = defineEmits(['close'])

const props = withDefaults(defineProps<Props>(), {
  title: 'PDF 阅读器',
  scale: 100
})

const isFullscreen = ref(false)

const toggleFullscreen = async () => {
  try {
    console.log('最大化窗口');
    await (window as any).window.electronAPI?.maximizeWindow();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
}

// DOM引用
const leftCanvas = ref<HTMLCanvasElement | null>(null)
const rightCanvas = ref<HTMLCanvasElement | null>(null)
const leftContainer = ref<HTMLElement | null>(null)
const rightContainer = ref<HTMLElement | null>(null)
const leftTextLayer = ref<HTMLElement | null>(null)
const rightTextLayer = ref<HTMLElement | null>(null)

// 页面状态
const currentPageLeft = ref(1)
const currentPageRight = ref(1)
const jumpPage = ref(1)
const totalPagesLeft = ref(0)
const totalPagesRight = ref(0)

const leftPdf = shallowRef<pdfjsLib.PDFDocumentProxy | null>(null)
const rightPdf = shallowRef<pdfjsLib.PDFDocumentProxy | null>(null)

// 渲染任务
const leftRenderTask = shallowRef<{ cancel: () => void } | null>(null)
const rightRenderTask = shallowRef<{ cancel: () => void } | null>(null)

// 事件处理
let resizeHandler: (() => void) | null = null

// 工具函数
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 调整文本层位置
const adjustTextLayerPosition = () => {
  nextTick(() => {
    [leftTextLayer, rightTextLayer].forEach((layerRef, index) => {
      const layer = layerRef.value;
      const canvas = index === 0 ? leftCanvas.value : rightCanvas.value;
      if (!layer || !canvas) return;

      layer.style.width = `${canvas.offsetWidth}px`;
      layer.style.height = `${canvas.offsetHeight}px`;
      layer.style.position = 'absolute';
      layer.style.left = '0';
      layer.style.top = '0';
      layer.style.zIndex = '9999';
      layer.style.pointerEvents = 'none'; // 避免遮挡画布交互
    });
  });
};

// 加载PDF
const loadPDF = async (filePath: string, canvas: HTMLCanvasElement, side: 'left' | 'right', pageNum = 1) => {
  try {
    // 取消旧任务
    if (side === 'left' && leftRenderTask.value?.cancel) {
      leftRenderTask.value.cancel()
    } else if (side === 'right' && rightRenderTask.value?.cancel) {
      rightRenderTask.value.cancel()
    }

    // 创建PDF加载任务
    const loadingTask = pdfjsLib.getDocument(filePath)
    const pdf = await loadingTask.promise

    // 更新状态
    if (side === 'left') {
      leftPdf.value = pdf
      totalPagesLeft.value = pdf.numPages
      currentPageLeft.value = pageNum
    } else {
      rightPdf.value = pdf
      totalPagesRight.value = pdf.numPages
      currentPageRight.value = pageNum
    }

    // 获取页面和上下文
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: props.scale / 100 })
    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) return

    // 计算容器尺寸
    const container = side === 'left' ? leftContainer.value : rightContainer.value
    const containerWidth = container!.clientWidth
    const scaleFactor = containerWidth / viewport.width
    const adjustedViewport = page.getViewport({ scale: (props.scale / 100) * scaleFactor })

    // 重置canvas尺寸
    canvas.width = adjustedViewport.width
    canvas.height = adjustedViewport.height
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)

    // 执行渲染
    const renderTask = page.render({
      canvasContext,
      viewport: adjustedViewport
    })

    // 渲染文本层
    const textLayerDiv = side === 'left' ? leftTextLayer.value : rightTextLayer.value;
    if (!textLayerDiv) {
      console.error(`文本层容器未找到 (${side})`)
      return;
    }
    
    // 清空并准备文本层容器
    // textLayerDiv.innerHTML = '';
    // textLayerDiv.style.width = `${adjustedViewport.width}px`;
    // textLayerDiv.style.height = `${adjustedViewport.height}px`;
    // textLayerDiv.style.position = 'absolute';
    // textLayerDiv.style.left = '0';
    // textLayerDiv.style.top = '0';
    // textLayerDiv.style.overflow = 'hidden';
    // textLayerDiv.style.opacity = '1';
    // textLayerDiv.style.lineHeight = '1';
    // textLayerDiv.style.zIndex = '9999';
    // textLayerDiv.style.pointerEvents = 'none';
    // textLayerDiv.style.fontFamily = 'sans-serif';

    // 获取文本内容
    const textContent = await page.getTextContent({
      includeMarkedContent: true,
    });

    // 使用正确的参数创建文本层实例
    const textLayer = new TextLayerBuilder({
      pdfPage: page,
    });

    // 使用正确的渲染选项渲染文本层
    textLayer.render({
      viewport: adjustedViewport,
      textContentParams: { 
        textContent, // 传入已获取的文本内容
        includeMarkedContent: true 
      }
    });
     
    if (textLayerDiv) {
      const textLayerElement = textLayer.div; // 或 textLayer.div
      if (textLayerElement) {
        textLayerDiv.innerHTML = ''; // 清空旧内容
        textLayerDiv.appendChild(textLayerElement);
      }
    }
    if (side === 'left') {
      leftRenderTask.value = renderTask
    } else {
      rightRenderTask.value = renderTask
    }

    await renderTask.promise
    
    // 渲染完成后调整文本层位置
    adjustTextLayerPosition();
  } catch (error: unknown) {
    if ((error as { message?: string })?.message !== 'Rendering cancelled') {
      console.error(`PDF加载失败 (${side}):`, error)
    }
  }
}

// 页面切换
const scrollToPage = async (pageNumber: number) => {
  if (leftPdf.value && leftCanvas.value) {
    currentPageLeft.value = Math.min(pageNumber, totalPagesLeft.value)
    await loadPDF(props.filePathLeft, leftCanvas.value, 'left', currentPageLeft.value)
  }
  if (rightPdf.value && rightCanvas.value) {
    currentPageRight.value = Math.min(pageNumber, totalPagesRight.value)
    await loadPDF(props.filePathRight, rightCanvas.value, 'right', currentPageRight.value)
  }
};

const jumpToPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= Math.max(totalPagesLeft.value, totalPagesRight.value)) {
    scrollToPage(jumpPage.value);
  }
};

const changePage = async (side: 'left' | 'right' | 'both', direction: 'prev' | 'next') => {
  const currentMax = Math.max(currentPageLeft.value, currentPageRight.value)
  const totalMax = Math.max(totalPagesLeft.value, totalPagesRight.value)
  let targetPage = direction === 'next' ? currentMax + 1 : currentMax - 1

  if (targetPage < 1 || targetPage > totalMax) return

  if (side === 'both' || side === 'left') {
    if (leftPdf.value && leftCanvas.value) {
      currentPageLeft.value = Math.min(targetPage, totalPagesLeft.value)
      await loadPDF(props.filePathLeft, leftCanvas.value, 'left', currentPageLeft.value)
    }
  }

  if (side === 'both' || side === 'right') {
    if (rightPdf.value && rightCanvas.value) {
      currentPageRight.value = Math.min(targetPage, totalPagesRight.value)
      await loadPDF(props.filePathRight, rightCanvas.value, 'right', currentPageRight.value)
    }
  }
}

// 滚动同步
const syncScroll = (source: 'left' | 'right') => {
  const leftCont = leftContainer.value
  const rightCont = rightContainer.value
  if (!leftCont || !rightCont) return

  if (source === 'left') {
    rightCont.scrollTop = leftCont.scrollTop
  } else {
    leftCont.scrollTop = rightCont.scrollTop
  }
}

// 初始化加载
const initPdfs = async () => {
  await nextTick()
  if (leftCanvas.value && props.filePathLeft) {
    loadPDF(props.filePathLeft, leftCanvas.value, 'left')
  }
  if (rightCanvas.value && props.filePathRight) {
    loadPDF(props.filePathRight, rightCanvas.value, 'right')
  }
}

// 生命周期
onMounted(() => {
  initPdfs()

  // 配置resize处理器
  resizeHandler = debounce(() => {
    if (leftCanvas.value && props.filePathLeft) {
      loadPDF(props.filePathLeft, leftCanvas.value, 'left', currentPageLeft.value)
    }
    if (rightCanvas.value && props.filePathRight) {
      loadPDF(props.filePathRight, rightCanvas.value, 'right', currentPageRight.value)
    }
    adjustTextLayerPosition();
  }, 300)

  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  // 移除resize监听
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }

  // 取消渲染任务
  if (leftRenderTask.value?.cancel) {
    leftRenderTask.value.cancel()
  }
  if (rightRenderTask.value?.cancel) {
    rightRenderTask.value.cancel()
  }
  
  // 清理全局变量
  window.pdfjsLib = undefined;
})
</script>

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
.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 禁用容器本身的交互 */
  z-index: 9999;
}

/* 文本块样式 */
.text-layer > span {
  color: transparent !important; /* 隐藏文本颜色 */
  position: absolute;
  white-space: pre; /* 保留空格和换行 */
  cursor: text; /* 鼠标变为文本选择样式 */
  transform-origin: 0% 0%;
  pointer-events: all; /* 允许文本块交互 */
  user-select: text; /* 允许选择文本 */
}

/* 选中高亮样式 */
.text-layer > span::selection {
  background: rgba(0, 0, 255, 0.2); /* 选中区域高亮 */
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}
</style>