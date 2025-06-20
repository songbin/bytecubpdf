<template>
  <div class="float-container">
    <n-tooltip trigger="hover" placement="right">
        <template #trigger>
    <n-float-button
      :right="20"
      :bottom="20"
      type="primary"
      @click="handleClick"
      v-model:show="show"
      style="position: fixed;"
    >
      <template #description>
        <n-icon :component="QuestionMark" size="20" />
      </template>
    </n-float-button>
    </template>
    使用帮助,点击查看
    </n-tooltip>
    <!-- <iframe 
      class="statistics-iframe"
      :src="STATISTICS.getUrl(pageName)" 
      height="2" 
      width="100%" 
      frameborder="0">
    </iframe> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { NFloatButton, NIcon,NTooltip } from 'naive-ui'
import { QuestionMarkFilled as QuestionMark } from '@vicons/material'
import { STATISTICS } from '@/renderer/constants/appconfig'

const props = defineProps({
  url: {
    type: String,
    required: true
  }
})

const show = ref(true)

const pageName = computed(() => {
  const parts = props.url.split('/')
  return parts[parts.length - 1].replace('.html', '')
})

const handleClick = () => {
  const open = (window as any).window.electronAPI?.openExternal || window.open
  open(props.url)
}
</script>

<style scoped>
.float-container {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.n-float-button {
  pointer-events: auto;
}
.btn-text {
  margin-left: 8px;
}
</style>