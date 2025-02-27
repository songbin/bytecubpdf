<template>
  <div class="about-container">
    <h1>关于我们</h1>
    <div class="section">
      <h2>团队简介</h2>
      <p>
        字节立方 是一款基于开源项目PDFMathTranslate的PDF翻译客户端，旨在帮助用户更轻松地使用PDFMathTranslate工具进行PDF文档的翻译。
      </p>
      
      <p>官方网站：
        <a 
          href="https://ts.bytecub.cn"  
          @click.prevent="handleClickLink('https://ts.bytecub.cn')" 
        >
          http://ts.bytecub.cn 
        </a>
      </p>
    </div>

    <div class="section">
      <h2>项目目标</h2>
      <ul>
        <li>简化PDFMathTranslate的使用流程，降低用户的使用门槛。</li>
        <li>提供直观的图形化界面，方便用户上传、翻译和下载PDF文件。</li>
        <li>支持多种语言和翻译服务，满足不同用户的需求。</li>
      </ul>
    </div>

    <div class="section">
      <h2>核心功能</h2>
      <ul>
        <li>文件上传：支持本地PDF文件的上传。</li>
        <li>语言选择：提供源语言和目标语言的选择。</li>
        <li>翻译服务选择：支持chatglm、deepseek等主流翻译服务。</li>
        <li>翻译进度显示：实时显示翻译进度。</li>
        <li>下载翻译结果：支持下载翻译后的PDF文件。</li>
        <li>PDF查看器：支持拖动和缩放功能，方便预览翻译结果。</li>
      </ul>
    </div>

    <div class="section">
      <h2>联系方式</h2>
      <p>如果有任何问题或建议，请通过以下方式联系我们：</p>
      <ul>
        <li>Email：songbin.sky@hotmail.com</li>
        <li>Github：稍晚点开源代码</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: "AboutPage",
  methods: {
    async handleClickLink(url) {
      // 通过预加载脚本暴露的 API 打开外部链接
      if (window.electronAPI && window.electronAPI.openExternal) {
        try {
          await window.electronAPI.openExternal(url);
        } catch (error) {
          console.error('打开链接失败:', error);
          // 可选：显示错误提示给用户
          alert('无法打开链接，请检查网络连接或稍后重试。');
        }
      } else {
        console.error(' 降级处理：当 Electron API 不可用时，尝试直接打开链接');
        // 降级处理：当 Electron API 不可用时，尝试直接打开链接
        window.open(url, '_blank');
      }
    },
  },
};
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.section {
  margin-bottom: 25px;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

p {
  line-height: 1.6;
  color: #666;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
  color: #666;
}

.section ul li {
  margin: 8px 0;
}

a {
  color: #42b983; /* 使用 Vue 的主题色 */
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>