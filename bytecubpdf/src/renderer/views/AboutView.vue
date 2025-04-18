<template>
  <div class="about-page">
    <n-layout>
      <n-layout-header class="hero-section">
        <h1 class="title">🌟 欢迎来到字节立方PDF翻译 🌟</h1>
        <p class="subtitle">完美保持排版的pdf翻译解决方案</p>
      </n-layout-header>

      <n-layout-content class="content-section">
        <n-grid :cols="3" :x-gap="24" responsive="screen">
          <!-- 快速通道 -->
          <n-grid-item>
            <n-card title="📌 快速通道" size="small" class="custom-card">
              <n-space vertical>
                <n-button 
                  v-for="(link, index) in quickLinks" 
                  :key="index"
                  block 
                  secondary
                  class="custom-button"
                  @click="openLink(link.url)"
                >
                  {{ link.icon }} {{ link.text }}
                </n-button>
              </n-space>
            </n-card>
          </n-grid-item>

          <!-- 功能介绍 -->
          <n-grid-item>
            <n-card title="✨ 核心功能" size="small" class="custom-card">
              <n-descriptions :column="1">
                <n-descriptions-item 
                  v-for="(item, index) in features" 
                  :key="index"
                  class="feature-item"
                >
                  <template #label>
                    <span class="feature-icon">{{ item.icon }}</span>
                  </template>
                  {{ item.text }}
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-grid-item>

          <!-- 二维码区域 -->
          <n-grid-item>
            <n-card title="💬 加入社群" size="small" class="custom-card">
              <div class="qr-wrapper">
                <n-image 
                  src="https://ts.bytecub.cn/imgs/wechat.jpg"
                  width="200"
                  preview-disabled
                  class="qr-image"
                />
                <p class="qr-tip">扫码加入技术交流群</p>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script lang="ts" setup>
import { 
  NLayout, 
  NLayoutHeader, 
  NLayoutContent,
  NGrid, 
  NGridItem, 
  NCard, 
  NButton, 
  NSpace,
  NDescriptions, 
  NDescriptionsItem,
  NImage 
} from 'naive-ui'

const quickLinks = [
  { icon: '🏠', text: '官网首页', url: 'https://www.bytecub.cn/' },
  { icon: '🚀', text: '立即下载', url: 'https://ts.bytecub.cn/down.html' },
  { icon: '📖', text: '使用指南', url: 'https://kkrverrhzg.feishu.cn/wiki/GIX7wMCfXiYsLEkNuJgcJYWnnyf' },
  { icon: '❓', text: '常见问题', url: 'https://kkrverrhzg.feishu.cn/wiki/WNkJw8xZFiyJB0kA3x5cTIuxnWd' },
  { icon: '💡', text: '提问技巧', url: 'https://kkrverrhzg.feishu.cn/wiki/N2kswSUK9ibqfykzgXDc19M1n1c' }
]

const features = [
  { icon: '🎨', text: '排版魔术师 - 翻译后文档保持原格式' },
  { icon: '🌍', text: '语言通 - 支持多种种语言互译' },
  { icon: '🔒', text: '隐私守护者 - 本地处理保障安全' }
]

const openLink = (url: string) => {
  (window as any).window.electronAPI?.openExternal(url)
}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  padding: 24px;
  background: #f5f7fa;
  width: 100%;
  box-sizing: border-box;
}

.hero-section {
  padding: 48px 24px;
  background: linear-gradient(45deg, #a8edea, #fed6e3);
  border-radius: 12px;
  margin-bottom: 24px;
  text-align: center;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.subtitle {
  color: #34495e;
  margin-top: 8px;
  font-size: 1.1rem;
}

.content-section {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 自定义卡片样式 */
:deep(.custom-card) {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

:deep(.custom-card:hover) {
  transform: translateY(-5px);
}

/* 自定义按钮样式 */
:deep(.custom-button) {
  margin: 8px 0;
  transition: all 0.3s;
}

:deep(.custom-button:hover) {
  background-color: #e0e7ff !important;
}

.qr-wrapper {
  text-align: center;
  padding: 8px 0;
}

.qr-image {
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: transform 0.3s;
}

.qr-image:hover {
  transform: scale(1.03);
}

.qr-tip {
  color: #666;
  font-size: 0.875rem;
  margin-top: 12px;
}

.feature-icon {
  font-size: 1.2em;
  margin-right: 8px;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 768px) {
  :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
  
  .hero-section {
    padding: 32px 16px;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style>