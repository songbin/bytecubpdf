<template>
  <div class="page">
    <h1>🚀 服务配置指南</h1>
    
    <div class="guide-section">
      <h3>🔑 密钥申请</h3>
      <p>需要先申请以下两个平台的密钥：</p>
      <ul>
        <li>
          <strong>智谱AI (ChatGLM)</strong>：推荐使用免费的GLM-4-Flash模型<br>
          申请地址：
          <a 
            href="https://info.bytecub.cn/index.php/2025/02/11/zhi-pu-ai-chatglm-kai-fang-ping-tai-mi-yao-shen-qing/" 
            @click.prevent="handleClickLink('https://info.bytecub.cn/index.php/2025/02/11/zhi-pu-ai-chatglm-kai-fang-ping-tai-mi-yao-shen-qing/')" 
          >
            点击查看申请教程
          </a>
        </li>
        <li>
          <strong>DeepSeek</strong>：支持多种大模型调用<br>
          申请地址：
          <a 
            href="https://info.bytecub.cn/index.php/2025/02/11/ge-da-mo-xing-kai-fang-ping-tai-mi-yao-shen-qing/" 
            @click.prevent="handleClickLink('https://info.bytecub.cn/index.php/2025/02/11/ge-da-mo-xing-kai-fang-ping-tai-mi-yao-shen-qing/')" 
          >
            点击查看申请教程
          </a>
        </li>
      </ul>
    </div>

    <div class="guide-section">
      <h3>💡 使用小贴士</h3>
      <p>✅ <strong>日常使用推荐GLM-4-Flash</strong>：完全免费且性能足够应对大部分场景</p>
      <p>🚀 需要更高性能时，可以在下拉列表中选择：</p>
      <ul>
        <li>GLM-4-Plus</li>
        <li>DeepSeek系列模型</li>
      </ul>
    </div>

    <div class="guide-section">
      <h3>🔗 相关链接</h3>
      <p>官方网站：
        <a 
          href="https://ts.bytecub.cn"  
          @click.prevent="handleClickLink('https://ts.bytecub.cn')" 
        >
          http://ts.bytecub.cn 
        </a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServicesPage',
  methods: {
    async handleClickLink(url) {
      // 通过预加载脚本暴露的 API 打开外部链接
      if (window.electronAPI && window.electronAPI.openExternal) {
        try {
          await window.electronAPI.openExternal(url);
        } catch (error) {
          console.error('打开链接失败:', error);
          this.$message.error('无法打开链接，请检查网络连接或稍后重试');
        }
      } else {
        console.warn('Electron API 不可用，尝试使用浏览器打开');
        window.open(url, '_blank');
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.guide-section {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h3 {
  color: #42b883;
  border-bottom: 2px solid #42b883;
  padding-bottom: 8px;
}

ul {
  list-style: none;
  padding-left: 20px;
}

li {
  margin: 10px 0;
}

a {
  color: #3498db;
  text-decoration: underline;
}

a:hover {
  color: #2980b9;
}
</style>