<template>
  <div>
    <!-- 这里可以添加组件的模板内容 -->
    <p>{{ message }}</p>
  </div>
</template>

<script lang="ts" setup>
// 定义响应式数据
import { ref } from 'vue';

const message = ref('这是一个 Vue 3 + TypeScript + setup 语法的组件');
</script>

<style scoped>
/* 这里可以添加组件的样式 */
p {
  color: blue;
}
</style>
