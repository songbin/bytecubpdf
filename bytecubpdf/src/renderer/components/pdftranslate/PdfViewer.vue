<template>
  <div 
    class="pdf-viewer" 
    ref="viewerRef"
  >
    <div class="pdf-content">
      <iframe
        v-if="filePath"
        :src="filePath"
        :style="{ transform: `scale(${scale / 100})` }"
      ></iframe>
      <div v-else class="empty">
        <p>请在 props 中设置 `filePath` 来加载 PDF。</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
interface Props {
  filePath: string
  title?: string
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'PDF 阅读器',
  scale: 100
})

const viewerRef = ref<HTMLElement | null>(null)

</script>

<style scoped>
.pdf-viewer {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.pdf-viewer.is-maximized {
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
  /* padding: 12px 16px; */
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.viewer-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.n-button-group {
  margin-left: auto;
}

.pdf-content {
  flex: 1;
  overflow: auto;
  /* padding: 16px; */
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
  transform-origin: top left;
  transition: transform 0.2s;
}

.empty {
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
  
  .pdf-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 0;
  }
}
</style>