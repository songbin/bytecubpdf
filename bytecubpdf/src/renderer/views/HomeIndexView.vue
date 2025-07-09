<script setup lang="ts">
import { NCard,NFlex,NButton } from 'naive-ui';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'
const router = useRouter();
const toDocTools = () => {
    router.push({
        name: 'PdfTranslate',
    })
}
const toChat = () => {
    router.push({
        name: 'MainChat',
    })
}

</script>

<template>
  <div>
    <n-flex justify="space-around">
        <n-card title="文档工具" @click="toDocTools" hoverable style="cursor: pointer;">
            1. PDF翻译<br/>
            2. OCR识别
        </n-card>
        <n-card title="聊天会话" hoverable @click="toChat" style="cursor: pointer;">
            1. 可以选择大模型,自由对话<br/>
            2. 可以和文件对话(可限制文件内容对话，拒绝大模型胡乱联想)
        </n-card>
        <n-card title="其他功能" hoverable style="cursor: pointer;">敬请期待……</n-card>
       
    </n-flex>
     <HelpFloatButton url="https://www.docfable.com" />
  </div>
</template>

<style scoped>
.n-card {
  width: 300px;
  height: 210px;
}
</style>
