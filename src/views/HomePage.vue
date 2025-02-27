<template>
  <div class="container">
    <!-- 上半部分 -->
    <div class="upper-section">
      <PdfTranslate />
    </div>

    <!-- 中间部分（信息滚动播报） -->
    <div class="middle-section">
      <div class="scroll-container">
        <div class="scroll-content">
          <div
            v-for="(item, index) in infoList"
            :key="index"
            class="message-item"
            @click="handleClick(item.link)"
          >
            {{ item.title }}
          </div>
        </div>
      </div>
    </div>

    <!-- 下半部分 -->
    <div class="lower-section">
      <textarea v-model="scriptResult" rows="20" cols="50" readonly placeholder="脚本执行结果"></textarea>
    </div>

    <!-- iframe 容器 -->
    <div class="iframe-section">
      <iframe src="https://ts.bytecub.cn/tongji.html" height="2" width="100%" frameborder="0"></iframe>
    </div>
  </div>
</template>

<script>
import PdfTranslate from '@/components/PdfTranslate.vue';

export default {
  name: 'HomePage',
  components: {
    PdfTranslate
  },
  data() {
    return {
      scriptResult: '', // 存储脚本执行结果
      infoList: [] // 存储信息列表
    };
  },
  mounted() {
    window.electronAPI.receiveScriptOutput((result) => {
      console.log('脚本执行结果:', result);

      // 将新数据追加到 scriptResult
      this.scriptResult += '\n' + result.data;

      // 将 scriptResult 按行分割
      const lines = this.scriptResult.split('\n');

      // 如果行数超过 1000，仅保留最近的 1000 行
      if (lines.length > 1000) {
        this.scriptResult = lines.slice(-1000).join('\n');
      }

         // 滚动到底部
         this.$nextTick(() => {
        // 获取 textarea 元素
        const textarea = this.$el.querySelector('textarea');
        if (textarea) {
          // 设置滚动到底部
          textarea.scrollTop = textarea.scrollHeight;
        }
      });
    });

    // 获取信息列表
    this.fetchInfoList();
  },
  methods: {
    async fetchInfoList() {
      try {
        // 获取最新消息的 API URL
        const apiUrl = 'https://info.bytecub.cn/get_latest_posts.php?count=10';

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.posts && data.posts.length > 0) {
          this.infoList = data.posts.map(post => ({
            title: post.title,
            link: post.link
          }));
        }
      } catch (error) {
        console.error('获取信息列表失败:', error);
      }
    },
    handleClick(url) {
      // 通过预加载脚本暴露的 API 打开外部链接
      if (window.electronAPI && window.electronAPI.openExternal) {
        try {
          window.electronAPI.openExternal(url);
        } catch (error) {
          console.error('打开链接失败:', error);
          alert('无法打开链接，请检查网络连接或稍后重试。');
        }
      } else {
        console.error('降级处理：当 Electron API 不可用时，尝试直接打开链接');
        window.open(url, '_blank');
      }
    }
  }
};
</script>

<style scoped>
.container {
  height: 100vh; /* 确保容器占满整个视口 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
}

.upper-section {
  height: 620px; /* 设置固定高度 */
  border-bottom: 1px solid #ddd;
  overflow: hidden; /* 防止内容溢出 */
}

.middle-section {
  flex-shrink: 0;
  background-color: #f9f9f9;
  overflow: hidden;
  height: 30px; /* 调整为更小的高度 */
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  white-space: nowrap;
  animation: scrollAnimation 60s linear infinite;
}

.message-item {
  display: inline-block;
  margin-right: 20px;
  padding: 5px 10px; /* 减少 padding */
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  border-radius: 5px;
  text-align: center;
  vertical-align: top;
  cursor: pointer;
  font-size: 14px; /* 调整字体大小 */
}

.message-item:hover {
  background-color: #f0f0f0;
}

.lower-section {
  flex: 1;
  min-height: 0; /* 修复 flex 容器高度分配问题 */
  background-color: #f9f9f9;
  overflow: hidden; /* 防止内容溢出 */
  padding: 10px; /* 增加内边距 */
}

textarea {
  width: 100%;
  height: 100px; /* 填满父容器 */
  background-color: #f5f5f5;
  resize: none;
  color: #333;
  border: none;
  padding: 10px;
  box-sizing: border-box;
  overflow-y: auto; /* 只在需要时显示文本域自身的滚动条 */
}

textarea:focus {
  outline: none;
}

@keyframes scrollAnimation {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* iframe 样式 */
.iframe-section {
  position: fixed; /* 改为固定定位 */
  bottom: 0;
  right: 0;
  height: 2px;
  width: 100%;
  z-index: 999;
}

.iframe-section iframe {
  width: 100%;
}
</style>