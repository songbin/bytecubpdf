<template>
  <div class="page">
    <iframe 
      src="https://ts.bytecub.cn/contract.html" 
      frameborder="0" 
      class="embedded-iframe"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'ContactPage'
}
</script>

<style scoped>
.page {
  padding: 20px;
  height: calc(100vh - 40px); /* 根据需要调整高度 */
}

.embedded-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px; /* 可选：添加圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 可选：添加阴影 */
}
</style>