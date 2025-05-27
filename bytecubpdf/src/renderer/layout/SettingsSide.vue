<template>
   <!--功能区域，目前只有一个doc-->
   <n-flex vertical   align="center">
    <n-button  circle @click="router.push({ name: 'About' })">
      <n-icon size="20"><Help /></n-icon>
    </n-button>
    <!-- <n-button  circle >
      <n-icon size="20"><Light /></n-icon>
    </n-button> -->

    <n-button  circle @click="router.push({ name: 'Settings' })">
      <n-icon size="20"><Settings /></n-icon>
    </n-button>
    <!-- <div class="iframe-section">
       
      <iframe src="https://api.docfable.com/tongji/client/tjv0.4.0.html" height="2" width="100%" frameborder="0"></iframe>
    </div> -->
  </n-flex>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import {Help,Light,Settings} from '@vicons/carbon'
import {NButton, NIcon,NFlex} from 'naive-ui'
import { useRouter } from 'vue-router' // 新增路由导入

const router = useRouter() // 获取路由实例
</script>

<style scoped>
 .n-button {
  margin-bottom: 5px;
}
.n-button:last-child {
  margin-bottom: 3;
}
.iframe-section {
  position: fixed; /* 改为固定定位 */
  bottom: 0;
  right: 0;
  height: 2px;
  width: 100%;
  z-index: 1;
}
</style>