<template>
  <div class="pdf-viewer" ref="viewerRef">
    <div class="pdf-content">
      <div class="pdf-columns">
        <div class="pdf-column" ref="leftContainer" @scroll="syncScroll('left')">
          <div v-if="filePathLeft" class="canvas-container">
            <canvas ref="leftCanvas" class="pdf-canvas"></canvas>
            <div class="text-layer" ref="leftTextLayer"></div>
          </div>
          <div v-else class="empty">
            <p>左侧 PDF 未加载</p>
          </div>
        </div>
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
      <div v-if="totalPagesLeft > 0 || totalPagesRight > 0" class="pdf-controls">
        <button @click="changePage('both', 'prev')" :disabled="currentPageLeft <= 1 && currentPageRight <= 1">上一页</button>
        <span>{{ Math.max(currentPageLeft, currentPageRight) }} / {{ Math.max(totalPagesLeft, totalPagesRight) }}</span>
        <button @click="changePage('both', 'next')" :disabled="currentPageLeft >= totalPagesLeft && currentPageRight >= totalPagesRight">下一页</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, shallowRef, onBeforeUnmount } from 'vue'

interface Props {
  filePathLeft: string
  filePathRight: string
  title?: string
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'PDF 阅读器',
  scale: 100
})

// DOM引用
const viewerRef = ref(null)
const leftCanvas = ref<HTMLCanvasElement | null>(null)
const rightCanvas = ref<HTMLCanvasElement | null>(null)
const leftContainer = ref<HTMLElement | null>(null)
const rightContainer = ref<HTMLElement | null>(null)

// 页面状态
const currentPageLeft = ref(1)
const currentPageRight = ref(1)
const totalPagesLeft = ref(0)
const totalPagesRight = ref(0)

// PDF对象
const leftPdf = shallowRef(null)
const rightPdf = shallowRef(null)

// 渲染任务
const leftRenderTask = shallowRef<{cancel: () => void} | null>(null)
const rightRenderTask = shallowRef<{cancel: () => void} | null>(null)

// 事件处理
let resizeHandler: (() => void) | null = null

// 工具函数
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number): ((...args: Parameters<T>) => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function(this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

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
    const loadingTask = (window as any).pdfjsLib.getDocument(filePath)
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

    if (side === 'left') {
      leftRenderTask.value = renderTask
    } else {
      rightRenderTask.value = renderTask
    }

    await renderTask.promise
  } catch (error: unknown) {
    if ((error as {message?: string})?.message !== 'Rendering cancelled') {
      console.error(`PDF加载失败 (${side}):`, error)
    }
  }
}

// 页面切换
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
})
</script>

<style scoped>
.pdf-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pdf-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.pdf-columns {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pdf-column {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  height: 100%;
}

.canvas-container {
  position: relative;
}

.pdf-canvas {
  display: block;
  margin: 0 auto;
  width: 100%;
  height: auto;
}

.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  opacity: 0.2;
  pointer-events: none;
  line-height: 1;
}

.text-layer span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
</style>