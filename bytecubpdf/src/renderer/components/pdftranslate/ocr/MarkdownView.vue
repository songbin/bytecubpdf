<template>
    <div 
      class="markdown-viewer"
      :class="{ 'is-maximized': isMaximized }"
      ref="viewerRef"
    >
      <div class="markdown-content" ref="contentRef" style="overflow-y: auto; height: 100%;">
        <div 
          v-if="loading"
          class="loading"
        >
          <n-spin />
        </div>
        <div 
          v-else-if="error"
          class="error"
        >
          <n-alert type="error">{{ error }}</n-alert>
        </div>
        <div 
          v-else-if="htmlContent"
          class="rendered-markdown"
          :style="{ transform: `scale(${scale / 100})` }"
       
        > <XMarkdown :markdown=htmlContent  />
      </div>
        <div 
          v-else 
          class="empty"
        >
          <p>请在 props 中设置 `source` 来加载 Markdown 内容</p>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, watch } from 'vue'
  import { marked } from 'marked'
  import katex from 'katex'
  import 'katex/dist/katex.min.css'
  import DOMPurify from 'dompurify'
  import { NButton, NIcon, NSpin, NAlert,useMessage } from 'naive-ui'
  import { XMarkdown  } from 'vue-element-plus-x'
  defineOptions({
  name: 'MarkdownView'
})
  interface Props {
    source: string | null // Markdown内容或URL
    title?: string
    scale?: number
  }
  const message = useMessage();
  const props = withDefaults(defineProps<Props>(), {
    title: 'Markdown 阅读器',
    scale: 100
  })
  
  const viewerRef = ref<HTMLElement | null>(null)
  const contentRef = ref<HTMLElement | null>(null)
  const htmlContent = ref<string | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const scale = ref<number>(props.scale)
  const isMaximized = ref<boolean>(false)
  
  // 加载Markdown内容
  const loadMarkdown = async () => {
    if (!props.source) return
  
    try {
      loading.value = true
      error.value = null
  
      let content = props.source
  
      // 如果不是直接传入的内容，则使用IPC获取文件内容
     
      content = await (window as any).electronAPI?.readFile(props.source)
      if (content === null) { 
          message.error('无法读取文件内容');
          return
      }
      
  
      // 转换Markdown为HTML
      const parsedContent = await marked.parse(content, { gfm: true })
// 渲染LaTeX公式
const renderedContent = parsedContent
  .replace(/\$\$(.*?)\$\$/g, (match, p1) => katex.renderToString(p1, { displayMode: true }))
  .replace(/\$(.*?)\$/g, (match, p1) => katex.renderToString(p1, { displayMode: false }))
      console.log(parsedContent)
      htmlContent.value = DOMPurify.sanitize(renderedContent)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载失败'
      message.error(error.value);
    } finally {
      loading.value = false
    }
  }
  
  // 缩放控制
  const increaseScale = () => {
    scale.value = Math.min(200, scale.value + 10)
  }
  
  const decreaseScale = () => {
    scale.value = Math.max(50, scale.value - 10)
  }
  
  const resetScale = () => {
    scale.value = 100
  }
  
  // 全屏切换
  const toggleMaximize = () => {
    isMaximized.value = !isMaximized.value
    // 触发resize事件让内容重新计算
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 300)
  }
  
  // 监听source变化
  watch(() => props.source, loadMarkdown)
  
  onMounted(() => {
    loadMarkdown()
  })
  </script>
  
  <style scoped>
  .markdown-viewer {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .markdown-viewer.is-maximized {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    border-radius: 0;
  }
  
  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #fafafa;
  }
  
  .viewer-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
  
  .n-button-group {
    display: flex;
    gap: 8px;
  }
  
  .markdown-content {
    flex: 1;
    overflow-y: auto;
    max-height: 100vh;
    padding: 16px;
    position: relative;
  }
  
  .rendered-markdown {
    width: 100%;
    transform-origin: top left;
    transition: transform 0.2s;
  }
  
  /* Markdown渲染样式 */
  .rendered-markdown h1,
  .rendered-markdown h2,
  .rendered-markdown h3,
  .rendered-markdown h4,
  .rendered-markdown h5,
  .rendered-markdown h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  
  .rendered-markdown p {
    margin: 1em 0;
  }
  
  .rendered-markdown code {
    background: #f5f5f5;
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }
  
  .rendered-markdown pre {
    background: #f5f5f5;
    padding: 1em;
    overflow-x: auto;
    border-radius: 4px;
    margin: 1em 0;
  }
  
  .empty,
  .loading,
  .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
    font-size: 14px;
  }
  
  @media print {
    .viewer-header,
    .n-button-group {
      display: none;
    }
    
    .markdown-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 0;
    }
  }
  </style>