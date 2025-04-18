<template>
      <div class="version-container">
        <p>当前版本：{{ currentVersion }}</p>
        <p v-if="upgradeInfo">最新版本：{{ upgradeInfo.version }}</p>
        <div v-if="upgradeInfo?.force_update" class="force-tip">⚠️ 本次为强制升级，必须立即更新</div>
        
        <h4>更新内容：</h4>
        <ul v-if="upgradeInfo?.changelog.length">
          <li v-for="(item, index) in upgradeInfo.changelog" :key="index">{{ item }}</li>
        </ul>
      </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
interface UpgradeInfo {
  version: string
  build_number: number
  force_update: boolean
  changelog: string[]
  download_url: string
}
const props = defineProps({
  modelValue: Boolean,
  currentVersion: String,
  upgradeInfo: {
    type: Object as () => UpgradeInfo | null,
    default: null
  }
})

const modalTitle = computed(() => props.upgradeInfo?.force_update 
  ? '强制版本升级' 
  : '版本升级提示'
)

 
</script>

<style scoped>

:deep(.n-modal) {
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
  position: fixed;
  margin: 0;
}


:deep(.n-modal-container) {
  width: 480px;
  max-width: 90vw; /* 添加响应式限制 */
}

.version-container {
  line-height: 1.6;
  padding: 0 24px;
}

.force-tip {
  color: var(--n-color-error);
  margin: 16px 0;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.update-btn {
  flex: 1;
}

.cancel-btn {
  flex: 1;
}
</style>