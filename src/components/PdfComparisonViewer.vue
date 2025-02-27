<template>
  <div class="pdf-comparison-container">
    <div class="divider" @mousedown="startDrag"></div>
    
    <!-- 左侧文件 -->
    <div class="left-panel" :style="{ width: leftWidth + '%' }">
      <iframe v-if="source" :src="source"></iframe>
      <div v-else class="empty">请选择源文件</div>
    </div>

    <!-- 右侧文件 -->
    <div class="right-panel" :style="{ width: (100 - leftWidth) + '%' }">
      <iframe v-if="target" :src="target"></iframe>
      <div v-else class="empty">请选择目标文件</div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['sourceFilePath', 'targetFilePath'],
  
  data() {
    return {
      leftWidth: 50,
      isDragging: false
    }
  },

  computed: {
    source() {
      return this.sourceFilePath ? `file://${this.sourceFilePath.replace(/\\/g, '/')}` : ''
    },
    target() {
      return this.targetFilePath ? `file://${this.targetFilePath.replace(/\\/g, '/')}` : ''
    }
  },

  methods: {
    startDrag() {
      this.isDragging = true
      document.addEventListener('mousemove', this.handleDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    handleDrag(e) {
      if (!this.isDragging) return
      const container = this.$el.getBoundingClientRect()
      const percent = ((e.clientX - container.left) / container.width) * 100
      this.leftWidth = Math.max(20, Math.min(80, percent))
    },

    stopDrag() {
      this.isDragging = false
      document.removeEventListener('mousemove', this.handleDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    }
  }
}
</script>

<style scoped>
.pdf-comparison-container {
  display: flex;
  height: 100vh;
  position: relative;
}

.left-panel, .right-panel {
  height: 100%;
  transition: width 0.3s;
}

iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.divider {
  position: absolute;
  left: 50%;
  width: 8px;
  height: 100%;
  background: #ddd;
  cursor: col-resize;
  z-index: 10;
}

.empty {
  height: 100%;
  display: grid;
  place-items: center;
  color: #666;
}
</style>