<template>
  <div class="page">
    <!-- 引入 PdfTranslate 组件 -->
    <HistoryView />
  </div>
</template>

<script>
// 引入 PdfTranslate 组件
import HistoryView from '@/components/HistoryView.vue';

export default {
  name: 'HistoryPage',
  components: {
    // 注册 PdfTranslate 组件
    HistoryView
  }
}
</script>

<style scoped>
/* .page {
  padding: 20px;
} */
</style>