<template>
  <div class="pdf-viewer" ref="viewerRef" :class="{ 'fullscreen': isFullscreen }">
    <div class="viewer-controls">
      <!-- 退出阅读按钮 -->
      <button @click="exitViewer" class="control-btn exit-btn">
        <i class="iconfont icon-exit"></i> 退出阅读
      </button>
      
      <!-- 全屏切换按钮 -->
      <button @click="toggleFullscreen" class="control-btn fullscreen-btn">
        <i class="iconfont" :class="isFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
        {{ isFullscreen ? '退出全屏' : '全屏显示' }}
      </button>
    </div>
    
    <div class="pdf-content">
      <div class="pdf-columns">
        <!-- 左侧PDF -->
        <div class="pdf-column" ref="leftColumn" @scroll="syncScroll('left')">
          <div v-if="!leftPdf" class="empty">请选择左侧PDF文件</div>
          <div v-else-if="leftRenderTask" class="loading-state">加载中...</div>
          <div v-else class="canvas-container">
            <canvas ref="leftCanvas" class="pdf-canvas"></canvas>
            <div ref="leftTextLayer" class="text-layer"></div>
          </div>
        </div>
        
        <!-- 右侧PDF -->
        <div class="pdf-column" ref="rightColumn" @scroll="syncScroll('right')">
          <div v-if="!rightPdf" class="empty">请选择右侧PDF文件</div>
          <div v-else-if="rightRenderTask" class="loading-state">加载中...</div>
          <div v-else class="canvas-container">
            <canvas ref="rightCanvas" class="pdf-canvas"></canvas>
            <div ref="rightTextLayer" class="text-layer"></div>
          </div>
        </div>
      </div>
      
      <!-- 统一的页面控制区域 -->
      <div class="unified-pdf-controls">
        <!-- 页码跳转 -->
        <div class="page-goto">
          <input 
            type="number" 
            v-model="targetPage" 
            min="1" 
            :max="Math.max(totalPagesLeft.value || 1, totalPagesRight.value || 1)" 
            class="page-input"
            placeholder="页码"
          />
          <button @click="gotoPage()" class="goto-btn">跳转</button>
        </div>
        
        <!-- 页面控制 -->
        <div class="page-controls">
          <button 
            @click="changePage(-1)" 
            :disabled="(currentPageLeft.value <= 1 && currentPageRight.value <= 1)"
            class="control-btn"
          >
            上一页
          </button>
          
          <div class="page-info">
            <span class="current-page">{{ currentPageLeft.value }}</span>
            <span class="page-separator">/</span>
            <span class="total-pages">{{ totalPagesLeft.value }}</span>
          </div>
          
          <button 
            @click="changePage(1)" 
            :disabled="(currentPageLeft.value >= totalPagesLeft.value && currentPageRight.value >= totalPagesRight.value)"
            class="control-btn"
          >
            下一页
          </button>
        </div>
        
        <!-- 文本搜索 -->
        <div class="search-controls">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索文本..." 
            class="search-input"
            @keyup.enter="searchText()"
          />
          <button @click="searchText()" class="search-btn">
            <i class="iconfont icon-search"></i>
          </button>
          <button v-if="searchResults.length > 0" @click="clearSearch()" class="clear-btn">
            <i class="iconfont icon-clear"></i>
          </button>
          <div v-if="searchResults.length > 0" class="search-results">
            {{ currentSearchIndex + 1 }}/{{ searchResults.length }}
            <button @click="highlightSearchResult(currentSearchIndex - 1)" 
                    class="nav-btn prev-btn"
                    :disabled="currentSearchIndex <= 0">
              <i class="iconfont icon-up"></i>
            </button>
            <button @click="highlightSearchResult(currentSearchIndex + 1)" 
                    class="nav-btn next-btn"
                    :disabled="currentSearchIndex >= searchResults.length - 1">
              <i class="iconfont icon-down"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch, defineEmits } from 'vue'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer.mjs'

// 添加 debounce 函数实现
function debounce(func, wait) {
  let timeout
  return function(...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}


// 定义发射事件
const emit = defineEmits(['exit'])

// 浏览器环境检测(单一声明)
const isBrowser = typeof window !== 'undefined'

// 组件引用
const viewerRef = ref(null)
const leftColumn = ref(null)
const rightColumn = ref(null)
const leftCanvas = ref(null)
const rightCanvas = ref(null)
const leftTextLayer = ref(null)
const rightTextLayer = ref(null)

// 全屏状态
const isFullscreen = ref(false)

// PDF相关状态
const leftPdf = ref(null)
const rightPdf = ref(null)
const leftRenderTask = ref(null)
const rightRenderTask = ref(null)
const currentPageLeft = ref(1)
const currentPageRight = ref(1)
const totalPagesLeft = ref(0)
const totalPagesRight = ref(0)

// 页码跳转状态
const targetPage = ref(1)

// 搜索相关状态
const searchQuery = ref('')
const searchResults = ref([])
const currentSearchIndex = ref(0)

// 防抖处理函数
let resizeHandler = null

// 组件属性
const props = defineProps({
  filePathLeft: {
    type: String,
    default: ''
  },
  filePathRight: {
    type: String,
    default: ''
  }
})

// 退出PDF阅读功能
// 退出阅读
function exitViewer() {
  // 如果处于全屏状态，先退出全屏
  if (isFullscreen.value) {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    isFullscreen.value = false
  }
  
  // 取消渲染任务
  if (leftRenderTask.value && !leftRenderTask.value._internalRenderTask.cancelled) {
    leftRenderTask.value.cancel()
  }
  
  if (rightRenderTask.value && !rightRenderTask.value._internalRenderTask.cancelled) {
    rightRenderTask.value.cancel()
  }
  
  // 清空文本层和搜索
  clearSearch()
  
  // 通知父组件退出阅读
  emit('exit')
}

// 跳转到指定页码
async function gotoPage() {
  if (!targetPage.value) return
  
  const page = parseInt(targetPage.value)
  if (isNaN(page)) return
  
  // 检查页码是否有效（使用左右两侧PDF的页数取较大值）
  const maxPages = Math.max(totalPagesLeft.value || 1, totalPagesRight.value || 1)
  const validPage = Math.min(Math.max(1, page), maxPages)
  
  // 更新页码
  if (props.filePathLeft && leftCanvas.value) {
    await loadPDF(props.filePathLeft, leftCanvas.value, 'left', validPage)
  }
  
  if (props.filePathRight && rightCanvas.value) {
    await loadPDF(props.filePathRight, rightCanvas.value, 'right', validPage)
  }
  
  // 清除输入
  targetPage.value = ''
}

// 全屏切换功能
function toggleFullscreen() {
  if (!isBrowser) return

  const element = viewerRef.value
  if (!element) return

  if (!document.fullscreenElement) {
    // 进入全屏
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen()
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
}

// 设置全屏监听器
function setupFullscreenListener() {
  if (!isBrowser) return () => {}

  // 全屏状态变化监听
  const fullscreenChangeHandler = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  // 添加不同浏览器的全屏事件监听
  document.addEventListener('fullscreenchange', fullscreenChangeHandler)
  document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler)
  document.addEventListener('mozfullscreenchange', fullscreenChangeHandler)
  document.addEventListener('MSFullscreenChange', fullscreenChangeHandler)

  // 返回清理函数
  return () => {
    document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
    document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler)
    document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler)
    document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler)
  }
}

// 页面切换功能 - 实现左右两侧同步翻页
function changePage(direction) {
  if (!isBrowser) return

  // 获取当前左右页面和最大页数
  const currentLeft = currentPageLeft.value
  const currentRight = currentPageRight.value
  const maxLeft = totalPagesLeft.value || 1
  const maxRight = totalPagesRight.value || 1
  
  // 计算新的页码
  let newPageLeft = currentLeft + direction
  let newPageRight = currentRight + direction
  
  // 确保页码在合法范围
  newPageLeft = Math.max(1, Math.min(newPageLeft, maxLeft))
  newPageRight = Math.max(1, Math.min(newPageRight, maxRight))
  
  // 仅当页码实际变更时才重新加载
  if (props.filePathLeft && leftCanvas.value && newPageLeft !== currentLeft) {
    loadPDF(props.filePathLeft, leftCanvas.value, 'left', newPageLeft)
  }
  
  if (props.filePathRight && rightCanvas.value && newPageRight !== currentRight) {
    loadPDF(props.filePathRight, rightCanvas.value, 'right', newPageRight)
  }
}

// 文本搜索功能
async function searchText() {
  if (!searchQuery.value || searchQuery.value.trim() === '') return
  
  // 确保两个PDF都已加载
  if ((!leftPdf.value && props.filePathLeft) || (!rightPdf.value && props.filePathRight)) {
    // 如果PDF尚未加载，先加载
    await initPdfs()
  }
  
  // 执行搜索
  performSearch(searchQuery.value.toLowerCase())
}

// 执行PDF搜索
async function performSearch(query) {
  if (!query) return
  
  // 清除之前的搜索结果
  clearSearch()
  searchResults.value = []
  
  try {
    // 搜索左侧PDF
    if (leftPdf.value) {
      for (let i = 1; i <= leftPdf.value.numPages; i++) {
        const page = await leftPdf.value.getPage(i)
        const textContent = await page.getTextContent()
        const textItems = textContent.items
        
        for (let j = 0; j < textItems.length; j++) {
          const item = textItems[j]
          if (item.str.toLowerCase().includes(query)) {
            searchResults.value.push({
              side: 'left',
              page: i,
              text: item.str,
              position: item.transform // 文本位置信息
            })
          }
        }
      }
    }
    
    // 搜索右侧PDF
    if (rightPdf.value) {
      for (let i = 1; i <= rightPdf.value.numPages; i++) {
        const page = await rightPdf.value.getPage(i)
        const textContent = await page.getTextContent()
        const textItems = textContent.items
        
        for (let j = 0; j < textItems.length; j++) {
          const item = textItems[j]
          if (item.str.toLowerCase().includes(query)) {
            searchResults.value.push({
              side: 'right',
              page: i,
              text: item.str,
              position: item.transform // 文本位置信息
            })
          }
        }
      }
    }
    
    // 如果有搜索结果，高亮第一个
    if (searchResults.value.length > 0) {
      highlightSearchResult(0, true)
    }
  } catch (error) {
    console.error('执行搜索时出错:', error)
  }
}

// 高亮搜索结果
async function highlightSearchResult(direction = 1, isFirst = false) {
  if (searchResults.value.length === 0) return
  
  // 计算下一个或上一个索引
  if (!isFirst) {
    const nextIndex = (currentSearchIndex.value + direction + searchResults.value.length) % searchResults.value.length
    currentSearchIndex.value = nextIndex
  }
  
  // 获取当前高亮结果
  const result = searchResults.value[currentSearchIndex.value]
  
  // 如果当前显示的页面不是结果所在页面，需要先加载该页面
  const side = result.side
  const resultPage = result.page
  
  if (side === 'left' && currentPageLeft.value !== resultPage) {
    // 先加载对应页面
    if (props.filePathLeft && leftCanvas.value) {
      await loadPDF(props.filePathLeft, leftCanvas.value, 'left', resultPage)
    }
  } else if (side === 'right' && currentPageRight.value !== resultPage) {
    // 先加载对应页面
    if (props.filePathRight && rightCanvas.value) {
      await loadPDF(props.filePathRight, rightCanvas.value, 'right', resultPage)
    }
  }
  
  // 创建高亮元素
  clearSearch(false) // 清除已有高亮，保留搜索结果
  
  // 选择对应的文本层
  const textLayer = side === 'left' ? leftTextLayer.value : rightTextLayer.value
  if (!textLayer) return
  
  // 创建高亮元素
  const highlight = document.createElement('div')
  highlight.className = 'search-highlight current'
  
  // 计算高亮元素位置
  const position = result.position
  const [scaleX, , , scaleY, translateX, translateY] = position
  
  // 设置高亮元素样式
  highlight.style.left = `${translateX}px`
  highlight.style.top = `${translateY}px`
  highlight.style.width = `${Math.abs(scaleX * result.text.length * 8)}px` // 近似宽度
  highlight.style.height = `${Math.abs(scaleY * 1.5)}px` // 略大于文字高度
  
  // 添加到文本层
  textLayer.appendChild(highlight)
  
  // 滚动到可见区域
  scrollToTextPosition(side, translateX, translateY)
}

// 滚动到文本位置
function scrollToTextPosition(side, x, y) {
  const column = side === 'left' ? leftColumn.value : rightColumn.value
  if (!column) return
  
  // 计算滚动位置，让高亮区域出现在视口中间
  const viewportHeight = column.clientHeight
  const scrollTop = y - viewportHeight / 2
  
  // 平滑滚动到目标位置
  column.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  })
}

// 清除搜索结果和高亮
function clearSearch(clearResults = true) {
  // 移除高亮元素
  if (leftTextLayer.value) {
    const highlights = leftTextLayer.value.querySelectorAll('.search-highlight')
    highlights.forEach(highlight => highlight.remove())
  }
  
  if (rightTextLayer.value) {
    const highlights = rightTextLayer.value.querySelectorAll('.search-highlight')
    highlights.forEach(highlight => highlight.remove())
  }
  
  // 清除搜索结果
  if (clearResults) {
    searchResults.value = []
    currentSearchIndex.value = -1
    searchQuery.value = ''
  }
}

// PDF加载和渲染函数
async function loadPDF(filePath, canvas, side, pageNumber = 1) {
  if (!isBrowser) return

  // 获取对应的文本层元素
  const textLayer = side === 'left' ? leftTextLayer.value : rightTextLayer.value
  if (textLayer) {
    // 清空文本层内容
    textLayer.innerHTML = ''
  }

  try {
    // 引入pdfjs
    const pdfjs = await import('pdfjs-dist')
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

    // 获取当前的渲染任务引用
    const renderTask = side === 'left' ? leftRenderTask : rightRenderTask
    
    // 如果已有渲染任务，则取消
    if (renderTask.value && renderTask.value.cancel) {
      renderTask.value.cancel()
      renderTask.value = null
    }

    // 加载PDF文档
    const loadingTask = pdfjs.getDocument({
      url: filePath,
      cMapUrl: './cmaps/',
      cMapPacked: true
    })

    // 获取PDF文档对象
    const pdf = await loadingTask.promise
    
    // 保存PDF文档引用
    if (side === 'left') {
      leftPdf.value = pdf
      totalPagesLeft.value = pdf.numPages
      currentPageLeft.value = Math.min(Math.max(1, pageNum), pdf.numPages)
    } else {
      rightPdf.value = pdf
      totalPagesRight.value = pdf.numPages
      currentPageRight.value = Math.min(Math.max(1, pageNum), pdf.numPages)
    }

    // 获取要渲染的页面
    const pageNumber = side === 'left' ? currentPageLeft.value : currentPageRight.value
    const page = await pdf.getPage(pageNumber)

    // 计算缩放比例
    const defaultScale = 1.0

    // 考虑设备像素比以支持高清显示
    const pixelRatio = window.devicePixelRatio || 1

    // 计算视口，调整为容器宽度
    const container = side === 'left' ? leftColumn.value : rightColumn.value
    const containerWidth = container ? container.clientWidth - 40 : 800 // 减去内边距

    const viewport = page.getViewport({ scale: defaultScale })
    const adjustedScale = containerWidth / viewport.width
    const adjustedViewport = page.getViewport({ scale: adjustedScale * pixelRatio })

    // 设置canvas尺寸
    const context = canvas.getContext('2d')

    // 设置物理像素尺寸（实际渲染分辨率）
    canvas.height = adjustedViewport.height
    canvas.width = adjustedViewport.width

    // 设置CSS像素尺寸（显示大小）
    canvas.style.height = `${adjustedViewport.height / pixelRatio}px`
    canvas.style.width = `${adjustedViewport.width / pixelRatio}px`

    // 设置文本层尺寸
    if (textLayer) {
      textLayer.style.height = `${adjustedViewport.height / pixelRatio}px`
      textLayer.style.width = `${adjustedViewport.width / pixelRatio}px`
      // 确保文本层位置与canvas重叠
      textLayer.style.left = canvas.offsetLeft + 'px'
      textLayer.style.top = canvas.offsetTop + 'px'
      textLayer.style.position = 'absolute'
      // 启用文本选择
      textLayer.style.pointerEvents = 'auto'
      // 确保文本层在canvas上方
      textLayer.style.zIndex = '1'
    }

    // 渲染PDF页面
    const renderContext = {
      canvasContext: context,
      viewport: adjustedViewport,
      enableWebGL: true,
      renderInteractiveForms: true,
      imageResourcesPath: './images/',
      useSystemFonts: true
    }

    // 开始渲染任务
    const task = page.render(renderContext)

    // 保存渲染任务引用
    if (side === 'left') {
      leftRenderTask.value = task
    } else {
      rightRenderTask.value = task
    }

    // 等待渲染完成
    await task.promise

    // 渲染文本层
    if (textLayer) {
      const textContent = await page.getTextContent()
      const { TextLayerBuilder } = await import('pdfjs-dist/web/pdf_viewer')
      
      const textLayerBuilder = new TextLayerBuilder({
        textLayerDiv: textLayer,
        pageIndex: pageNumber - 1,
        viewport: adjustedViewport.clone({ scale: 1 / pixelRatio }) // 调整回CSS尺寸
      })
      
      textLayerBuilder.setTextContent(textContent)
      textLayerBuilder.render()
    }
    
    return { success: true }
  } catch (error) {
    console.error(`加载PDF时出错 (${side}):`, error)
    return { success: false, error }
  }
}

// 同步滚动函数
function syncScroll(event) {
  if (!event || !event.target) return
  
  const scrollElement = event.target
  const isLeftColumn = scrollElement === leftColumn.value
  
  // 获取目标滚动容器
  const targetElement = isLeftColumn ? rightColumn.value : leftColumn.value
  if (!targetElement) return
  
  // 计算滚动比例以保持相对位置一致
  const sourceScrollMax = scrollElement.scrollHeight - scrollElement.clientHeight
  if (sourceScrollMax <= 0) return
  
  const scrollRatio = scrollElement.scrollTop / sourceScrollMax
  
  // 应用相同比例到目标容器
  const targetScrollMax = targetElement.scrollHeight - targetElement.clientHeight
  targetElement.scrollTop = scrollRatio * targetScrollMax
}

// PDF初始化加载函数
async function initPdfs() {
  if (!isBrowser) return
  
  try {
    if (props.filePathLeft && leftCanvas.value) {
      await loadPDF(props.filePathLeft, leftCanvas.value, 'left')
    }
    
    if (props.filePathRight && rightCanvas.value) {
      await loadPDF(props.filePathRight, rightCanvas.value, 'right')
    }
  } catch (error) {
    console.error('初始化PDF时出错:', error)
  }
}

// 组件挂载时初始化
onMounted(() => {
  if (isBrowser) {
    // 初始化PDF
    nextTick(() => {
      initPdfs()
    })
    
    // 设置窗口大小变化监听器，使用防抖优化性能
    resizeHandler = debounce(() => {
      if (props.filePathLeft && leftCanvas.value) {
        loadPDF(props.filePathLeft, leftCanvas.value, 'left', currentPageLeft.value)
      }
      if (props.filePathRight && rightCanvas.value) {
        loadPDF(props.filePathRight, rightCanvas.value, 'right', currentPageRight.value)
      }
    }, 300)
    
    window.addEventListener('resize', resizeHandler)
    
    // 设置全屏监听
    const removeFullscreenListener = setupFullscreenListener()
    
    // 保存清理函数，在组件卸载时执行
    onBeforeUnmount(() => {
      // 移除事件监听器
      window.removeEventListener('resize', resizeHandler)
      removeFullscreenListener()
      
      // 取消渲染任务
      if (leftRenderTask.value) {
        try {
          leftRenderTask.value.cancel()
        } catch (error) {
          console.log('取消左侧渲染任务出错:', error)
        }
      }
      
      if (rightRenderTask.value) {
        try {
          rightRenderTask.value.cancel()
        } catch (error) {
          console.log('取消右侧渲染任务出错:', error)
        }
      }
      
      // 清除搜索高亮和结果
      clearSearch()
    })
  }
})

onBeforeUnmount(() => {
  // 移除resize事件监听器
  if (isBrowser) {
    window.removeEventListener('resize', resizeHandler)
  }
  
  // 取消渲染任务
  if (leftRenderTask.value) {
    try {
      leftRenderTask.value.cancel()
    } catch (error) {
      console.warn('取消左侧渲染任务时出错:', error)
    }
  }
  
  if (rightRenderTask.value) {
    try {
      rightRenderTask.value.cancel()
    } catch (error) {
      console.warn('取消右侧渲染任务时出错:', error)
    }
  }
  
  // 清理文本层
  if (leftTextLayer.value) {
    leftTextLayer.value.innerHTML = ''
  }
  
  if (rightTextLayer.value) {
    rightTextLayer.value.innerHTML = ''
  }
})</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: absolute; /* 确保填满容器 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.pdf-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.viewer-controls {
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  z-index: 20;
}

.viewer-controls button {
  padding: 5px 10px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.85em;
}

.viewer-controls button:hover {
  background-color: #5a6268;
}

.pdf-columns {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 防止整体滚动 */
}

.pdf-column {
  flex: 1;
  max-width: 50%;
  height: 100%;
  overflow: auto; /* 只在PDF列内滚动 */
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  /* 添加滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

/* 自定义滚动条样式 */
.pdf-column::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.pdf-column::-webkit-scrollbar-track {
  background: transparent;
}

.pdf-column::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.canvas-container {
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.pdf-canvas {
  display: block;
  margin: 0 auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  border-radius: 2px;
  /* 提高渲染质量 */
  image-rendering: high-quality;
  transform-origin: top left;
}

.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.25; /* 提高默认透明度，使文本更容易看见 */
  line-height: 1.0;
  pointer-events: auto; /* 允许文本选择和交互 */
  user-select: text; /* 确保文本可选 */
  cursor: text; /* 文本选择光标 */
  z-index: 2; /* 确保在canvas之上但不遮挡控件 */
  transition: opacity 0.2s ease; /* 添加过渡效果 */
}

.text-layer:hover {
  opacity: 0.6; /* 增加悬停时的可见度 */
}

.text-layer > span {
  color: transparent;
  position: absolute;
  white-space: pre;
  transform-origin: 0% 0%; /* 起点在左上角 */
  /* 文本渲染优化 */
  font-kerning: none;
  font-variant: normal;
}

/* 搜索高亮样式 */
.search-highlight {
  position: absolute;
  background-color: rgba(255, 230, 0, 0.5);
  border-radius: 3px;
  z-index: 1;
  transition: all 0.2s ease; /* 添加过渡效果 */
}

/* 当前搜索结果高亮 */
.search-highlight.current {
  background-color: rgba(255, 150, 0, 0.7); /* 增加当前结果的对比度 */
  box-shadow: 0 0 8px rgba(255, 150, 0, 0.8); /* 增强阴影效果 */
  transform: scale(1.05); /* 稍微放大当前结果 */
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

/* 统一的PDF控制区域 */
.unified-pdf-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
  position: sticky;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  border-top: 1px solid #eee;
  z-index: 10;
  width: 100%;
}

.unified-pdf-controls button {
  padding: 6px 12px;
  background-color: #4a7bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
  font-size: 0.9em;
}

.unified-pdf-controls button:hover {
  background-color: #3a6bef;
}

.unified-pdf-controls button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 全屏模式样式调整 */
:fullscreen .pdf-viewer {
  background-color: white;
  padding: 0;
}

:fullscreen .pdf-column {
  padding: 15px;
}

:fullscreen .unified-pdf-controls {
  padding: 12px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* 不同浏览器全屏模式的兼容性处理 */
:-webkit-full-screen .pdf-viewer {
  background-color: white;
  padding: 0;
}

:-moz-full-screen .pdf-viewer {
  background-color: white;
  padding: 0;
}

:-ms-fullscreen .pdf-viewer {
  background-color: white;
  padding: 0;
}

/* 搜索控件样式优化 */
.search-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-input {
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
}

.search-btn, .clear-btn, .nav-btn {
  padding: 5px 8px;
  background-color: #4a7bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover, .clear-btn:hover, .nav-btn:hover {
  background-color: #3a6bef;
}

.search-btn:disabled, .clear-btn:disabled, .nav-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.search-results {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f0f5ff;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 0.9em;
  color: #4a7bff;
}

.nav-btn {
  padding: 2px 5px;
  font-size: 0.85em;
  background-color: #4a7bff;
}

.nav-btn:disabled {
  background-color: #cccccc;
}
</style>
