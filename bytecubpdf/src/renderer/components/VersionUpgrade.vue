<template>
    <n-modal
      v-model:show="isModalVisible" 
      :title="modalTitle"
      :mask-closable="false"
      :keyboard="false"
      preset="dialog"
    >
      <div class="version-container">
        <p>当前版本：{{ VERSION.version }}</p>
        <p v-if="upgradeInfo">最新版本：{{ upgradeInfo.version }}</p>
        <div v-if="upgradeInfo?.forceUpdate" class="force-tip">⚠️ 本次为强制升级，必须立即更新</div>
        
        <h4>更新内容：</h4>
        <ul v-if="upgradeInfo?.changelog.length">
          <li v-for="(item, index) in upgradeInfo.changelog" :key="index">{{ item }}</li>
        </ul>
      </div>
  
      <template #action>
        <div class="dialog-footer">
          <n-button 
            type="primary"
            @click="handleUpdate"
            class="update-btn"
          >
            立即升级
          </n-button>
          <n-button
            v-if="!upgradeInfo?.forceUpdate"
            @click="closeModal"
            class="cancel-btn"
          >
            稍后提醒
          </n-button>
        </div>
      </template>
    </n-modal>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import axios from 'axios';
  import { VERSION } from '@/shared/constants/dfconstants';
  import { NModal, NButton, useDialog,useMessage } from 'naive-ui'; // 添加 useDialog
  import {useVersionCheck} from '@/renderer/service/VersionCheck'
  const message = useMessage();
  const { checkForUpdates, upgradeInfo, isModalVisible } = useVersionCheck()
  
  const modalTitle = computed(() => upgradeInfo.value?.forceUpdate 
    ? '强制版本升级' 
    : '版本升级提示'
  );
  
  onMounted(async () => {
  //   await checkForUpdates()
  //   if (upgradeInfo.value?.build_number !== undefined 
  //     && upgradeInfo.value.build_number <= VERSION.buildNumber) {
  //     isModalVisible.value = false
  //   // message.success(`当前已是最新版本 (${VERSION.version})`)
  // }
  });
  

  watch(() => upgradeInfo.value?.forceUpdate, (newVal) => {
    if (newVal) {
      document.body.style.overflow = 'hidden';
      isModalVisible.value = true;
    }else if (upgradeInfo.value?.buildNumber !== undefined 
        && upgradeInfo.value.buildNumber <= VERSION.buildNumber) {
    // 添加版本相同时的处理
    isModalVisible.value = false;
  }
  });
  
  const handleUpdate = async (): Promise<void> => {
    if (!upgradeInfo.value) return;
    
    try {
      if ((window as any).window.electronAPI?.openExternal) {
        await (window as any).window.electronAPI.openExternal(upgradeInfo.value.downloadUrl);
      } else {
        window.open(upgradeInfo.value.downloadUrl, '_blank');
      }
    } catch (error: any) { 
      console.error('打开下载链接失败:', error);
      message.error('无法打开下载链接，请稍后重试');
    }
  };
  
  const dialog = useDialog(); // 添加对话框 hook
  
  const closeModal = (): void => {
    if (upgradeInfo.value?.forceUpdate) {
      // 强制更新时显示不可关闭提示
      dialog.warning({
        title: '强制升级提示',
        content: '当前版本必须立即升级，无法取消更新',
        positiveText: '确定',
        closable: false
      });
      return;
    }
    isModalVisible.value = false;
    document.body.style.overflow = 'auto';
  };
  </script>
  
  <style scoped>
  :deep(.n-modal-container) {
    --n-color-modal-mask: rgba(0, 0, 0, 0.6);
    width: 480px;
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