<template>
    <div class="pdf-viewer">
      <div class="viewer-header">
        <h3 class="viewer-title">{{ title }}</h3>
        <t-icon name="close" class="close-icon" @click="$emit('close')" />
      </div>
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
  
  <script>
  export default {
    props: {
      filePath: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        default: 'PDF 阅读器',
      },
      scale: {
        type: Number,
        default: 100,
      },
    },
  };
  </script>
  
  <style scoped>
  .pdf-viewer {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #ddd;
  }
  
  .viewer-title {
    font-size: 18px;
    font-weight: bold;
  }
  
  .close-icon {
    cursor: pointer;
  }
  
  .pdf-content {
    flex: 1;
    overflow: auto;
  }
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    font-size: 14px;
  }
  </style>