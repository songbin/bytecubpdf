<script lang="ts" setup>
import VuePdfEmbed from 'vue-pdf-embed'
import { ref, watch, onMounted, nextTick, shallowRef, onBeforeUnmount } from 'vue'
 
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
const isLoading = ref<boolean>(true)
const showAllPages = ref<boolean>(false)
const containerWidth = ref(0);
const containerHeight = ref(0);
const pdfContainer = ref<HTMLElement | null>(null);
const emit = defineEmits(['close'])
const updateDimensions = () => {
  if (pdfContainer.value) {
    containerWidth.value = pdfContainer.value.offsetWidth;
    containerHeight.value = pdfContainer.value.offsetHeight;
  }
};
watch(showAllPages, (newVal, oldVal) => {
  // 监听变化后的处理逻辑
  console.log('showAllPages changed:', newVal);
   page.value  =  showAllPages.value ? undefined : 1
   console.log('page.value -----', page.value)
});
onMounted(() => {
  const observer = new ResizeObserver(updateDimensions);
  if (pdfContainer.value) {
    observer.observe(pdfContainer.value);
    updateDimensions(); // 初始计算
  }
});

onMounted(() => {
  const observer = new ResizeObserver(updateDimensions);
  observer.disconnect();
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

const handleDocumentRender = () => {
  isLoading.value = false
  console.log('page:', page.value)
  // page.value = undefined
  // showAllPages.value = false
}

 
</script>

<template>
 
 <div class="app-header">
    <template v-if="isLoading">Loading...</template>

    <template v-else>
      <span v-if="showAllPages">{{ pageCount }} page(s)</span>

      <span v-else>
        <button :disabled="page! <= 1" @click="page!--">❮</button>
        <span>{{ page }} / {{ pageCount }}</span>
        <button :disabled="page! >= pageCount" @click="page!++">❯</button>
      </span>

      <label>
        <input v-model="showAllPages" type="checkbox">
        <span>Show all pages</span>
      </label>
    </template>
  </div>
  <div class="pdf-compare-container">
  <div ref="pdfContainer" class="app-content left-pane">
    <vue-pdf-embed
      :source="props.filePathLeft"
      :page="page"
      annotation-layer
      text-layer
      :width="containerWidth"
      :height="containerHeight"
      @loaded="handleDocumentLoad"
      @rendered="handleDocumentRender"
    />
  </div>
  <div ref="pdfContainer" class="app-content right-pane">
    <vue-pdf-embed
      :source="props.filePathRight"
      :page="page"
      annotation-layer
      text-layer
      :width="containerWidth"
      :height="containerHeight"
      @loaded="handleDocumentLoad"
      @rendered="handleDocumentRender"
    />
  </div>
  </div>
</template>
<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  box-shadow: 0 2px 8px 4px rgba(0, 0, 0, 0.1);
  background-color: #555;
  color: #ddd;
}

.app-header > * {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-content {
  padding: 24px 16px;
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
</style>