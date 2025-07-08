<template>
   <!--功能区域，目前只有一个doc-->
   <n-flex vertical align="center" >
     <n-button circle @click="router.push({ name: 'HomeIndex' })">
      <n-icon size="20"><Home /></n-icon>
    </n-button>
     <n-button circle @click="router.push({ name: 'MainChat' })">
      <n-icon size="20"><ChatBot /></n-icon>
    </n-button>
    <n-button  circle @click="router.push({ name: 'PdfTranslate' })">
      <n-icon size="20"><Document /></n-icon>
    </n-button>
    <!-- <n-button  circle >
      <n-icon size="20"><BlockStorageAlt /></n-icon>
    </n-button> -->
  </n-flex>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue'
import {Document,ChatBot,Home} from '@vicons/carbon'
import {NButton, NIcon, NFlex} from 'naive-ui'
import { useRouter } from 'vue-router' // 新增路由导入

const router = useRouter() // 获取路由实例
</script>

<style scoped>
 .n-button {
  margin-bottom: 8px;
}
.n-button:last-child {
  margin-bottom: 0;
}
</style>