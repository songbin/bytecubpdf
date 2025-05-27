<template>
  <div class="pdf-viewer" ref="viewerRef">
    <div class="pdf-content">
      <div v-if="isBrowser && (filePathLeft || filePathRight)" class="pdf-columns">
        <div class="pdf-column" ref="leftContainer" @scroll="syncScroll('left')">
          <div v-if="isBrowser && filePathLeft" class="canvas-container">
            <canvas ref="leftCanvas" class="pdf-canvas"></canvas>
            <div class="text-layer" ref="leftTextLayer"></div>
          </div>
          <div v-else class="empty">
            <p>左侧 PDF 未加载</p>
          </div>
          <div v-if="isBrowser && totalPagesLeft > 0" class="pdf-controls">
            <button @click="changePage('left', 'prev')" :disabled="currentPageLeft <= 1">上一页</button>
            <span>{{ currentPageLeft }} / {{ totalPagesLeft }}</span>
            <button @click="changePage('left', 'next')" :disabled="currentPageLeft >= totalPagesLeft">下一页</button>
          </div>
        </div>
        <div class="pdf-column" ref="rightContainer" @scroll="syncScroll('right')">
          <div v-if="isBrowser && filePathRight" class="canvas-container">
            <canvas ref="rightCanvas" class="pdf-canvas"></canvas>
            <div class="text-layer" ref="rightTextLayer"></div>
          </div>
          <div v-else class="empty">
            <p>右侧 PDF 未加载</p>
          </div>
          <div v-if="isBrowser && totalPagesRight > 0" class="pdf-controls">
            <button @click="changePage('right', 'prev')" :disabled="currentPageRight <= 1">上一页</button>
            <span>{{ currentPageRight }} / {{ totalPagesRight }}</span>
            <button @click="changePage('right', 'next')" :disabled="currentPageRight >= totalPagesRight">下一页</button>
          </div>
        </div>
      </div>
      <div v-else-if="!isBrowser" class="loading-state">
        <p>PDF加载中...</p>
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

// 定义refs
const viewerRef = ref(null)
const leftCanvas = ref<HTMLCanvasElement | null>(null)
const rightCanvas = ref<HTMLCanvasElement | null>(null)
const leftContainer = ref<HTMLElement | null>(null)
const rightContainer = ref<HTMLElement | null>(null)
const leftTextLayer = ref<HTMLElement | null>(null)
const rightTextLayer = ref<HTMLElement | null>(null)

// 定义状态变量
const currentPageLeft = ref(1)
const currentPageRight = ref(1)
const totalPagesLeft = ref(0)
const totalPagesRight = ref(0)
const leftPdf = shallowRef(null)
const rightPdf = shallowRef(null)

// 存储当前渲染任务的引用，用于取消之前的渲染
const leftRenderTask = shallowRef(null)
const rightRenderTask = shallowRef(null)

// 添加resize监听器的引用，用于在组件卸载时移除
let resizeHandler = null

// 检查是否在客户端环境
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

// 使用防抖函数减少resize事件触发频率
const debounce = (fn, delay) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 加载PDF文件
const loadPDF = async (filePath: string, canvas: HTMLCanvasElement, side: 'left' | 'right', pageNum = 1) => {
  if (!isBrowser || !canvas) return
  
  try {
    // 取消之前的渲染任务（如果存在）
    if (side === 'left' && leftRenderTask.value) {
      try {
        leftRenderTask.value.cancel()
      } catch (e) {
        console.warn('取消左侧渲染任务失败:', e)
      }
      leftRenderTask.value = null
    } else if (side === 'right' && rightRenderTask.value) {
      try {
        rightRenderTask.value.cancel()
      } catch (e) {
        console.warn('取消右侧渲染任务失败:', e)
      }
      rightRenderTask.value = null
    }
    
    // 创建PDF加载任务
    if (!window.pdfjsLib) {
      console.error('PDF.js 库未加载')
      return
    }
    
    const loadingTask = window.pdfjsLib.getDocument(filePath)
    const pdf = await loadingTask.promise
    
    if (side === 'left') {
      leftPdf.value = pdf
      totalPagesLeft.value = pdf.numPages
      currentPageLeft.value = pageNum
    } else {
      rightPdf.value = pdf
      totalPagesRight.value = pdf.numPages
      currentPageRight.value = pageNum
    }
    
    // 确保canvas存在且在DOM中
    if (!canvas || !canvas.getContext) {
      console.error('Canvas 元素不存在或无法获取上下文')
      return
    }
    
    const page = await pdf.getPage(pageNum)
    
    const viewport = page.getViewport({ scale: props.scale / 100 })
    const canvasContext = canvas.getContext('2d')
    
    if (!canvasContext) {
      console.error('无法获取 canvas 2D 上下文')
      return
    }
    
    // 调整canvas宽度根据容器大小
    const container = side === 'left' ? leftContainer.value : rightContainer.value
    if (!container) return
    
    const containerWidth = container.clientWidth
    
    // 计算适合容器的缩放比例
    const scaleFactor = containerWidth / viewport.width
    const adjustedViewport = page.getViewport({ scale: (props.scale / 100) * scaleFactor })
    
    // 设置canvas尺寸前先清空内容
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    canvas.height = adjustedViewport.height
    canvas.width = adjustedViewport.width
    
    // 保存渲染任务引用以便在需要时取消
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
    
  } catch (error) {
    if (error?.message !== 'Rendering cancelled') {
      console.error(`PDF加载失败 (${side}):`, error)
    }
  }
}

// 页面切换
const changePage = async (side: 'left' | 'right', direction: 'prev' | 'next') => {
  if (!isBrowser) return
  
  if (side === 'left' && leftPdf.value && leftCanvas.value) {
    let newPage = direction === 'next' ? currentPageLeft.value + 1 : currentPageLeft.value - 1
    if (newPage > 0 && newPage <= totalPagesLeft.value) {
      currentPageLeft.value = newPage
      await loadPDF(props.filePathLeft, leftCanvas.value, 'left', newPage)
    }
  } else if (side === 'right' && rightPdf.value && rightCanvas.value) {
    let newPage = direction === 'next' ? currentPageRight.value + 1 : currentPageRight.value - 1
    if (newPage > 0 && newPage <= totalPagesRight.value) {
      currentPageRight.value = newPage
      await loadPDF(props.filePathRight, rightCanvas.value, 'right', newPage)
    }
  }
}

// 同步滚动
const syncScroll = (source: 'left' | 'right') => {
  if (!isBrowser) return
  
  if (source === 'left' && rightContainer.value && leftContainer.value) {
    rightContainer.value.scrollTop = leftContainer.value.scrollTop
  } else if (source === 'right' && leftContainer.value && rightContainer.value) {
    leftContainer.value.scrollTop = rightContainer.value.scrollTop
  }
}

// 初始化加载PDF
const initPdfs = async () => {
  if (!isBrowser) return
  
  // 等待DOM更新
  await nextTick()
  
  if (leftCanvas.value && props.filePathLeft) {
    loadPDF(props.filePathLeft, leftCanvas.value, 'left')
  }
  if (rightCanvas.value && props.filePathRight) {
    loadPDF(props.filePathRight, rightCanvas.value, 'right')
  }
}

// 组件挂载后初始化
onMounted(() => {
  if (!isBrowser) return
  
  // 初始化PDF
  initPdfs()
  
  // 使用防抖处理resize事件
  resizeHandler = debounce(() => {
    if (leftCanvas.value && props.filePathLeft) {
      loadPDF(props.filePathLeft, leftCanvas.value, 'left', currentPageLeft.value)
    }
    if (rightCanvas.value && props.filePathRight) {
      loadPDF(props.filePathRight, rightCanvas.value, 'right', currentPageRight.value)
    }
  }, 300)
  
  // 响应窗口大小变化
  window.addEventListener('resize', resizeHandler)
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (!isBrowser) return
  
  // 移除事件监听器
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
  
  // 取消正在进行的渲染任务
  if (leftRenderTask.value) {
    try {
      leftRenderTask.value.cancel()
    } catch (e) {
      console.warn('取消左侧渲染任务失败:', e)
    }
  }
  
  if (rightRenderTask.value) {
    try {
      rightRenderTask.value.cancel()
    } catch (e) {
      console.warn('取消右侧渲染任务失败:', e)
    }
  }
})
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pdf-columns {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

.pdf-column {
  flex: 1;
  max-width: 50%;
  height: 100%;
  overflow: auto;
  padding: 10px;
  box-sizing: border-box;
  position: relative;
}

.canvas-container {
  position: relative;
  margin: 0 auto;
}

.pdf-canvas {
  display: block;
  margin: 0 auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1.0;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f9f9f9;
  color: #666;
  font-size: 16px;
}

.pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  gap: 10px;
}

.pdf-controls button {
  padding: 5px 10px;
  background-color: #4a7bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pdf-controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>