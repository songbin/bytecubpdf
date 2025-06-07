<template>
    <div>
      <n-modal 
        v-model:show="showDownloadModal" 
        preset="dialog"
        :mask-closable="false"
        :keyboard="false"
        @close="handleClose" 
        :close-on-esc="false"
        @before-close="beforeClose" 
        :show-header="true" 
        :show-footer="false"
      >
        <div class="modal-content">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
            <h3 style="margin: 0">资源下载</h3>
            <div>
              {{ filesToDownload?.length }} 个文件需要下载
              <n-switch v-model:value="showDetails">
                <template #checked>
                  收起详情
                </template>
                <template #unchecked>
                  查看详情
                </template>
              </n-switch>
            </div>
          </div>
          <n-alert v-if="error" type="error">{{ error }}</n-alert>
          <n-space vertical v-if="showDetails">
            <n-progress
              v-for="(item, index) in downloadList"
              :key="index"
              type="line"
              :percentage="item.progress"
              :status="mapStatus(item.status)"
            >
              {{ index + 1 }}/{{ downloadList.length }} {{ item.name }} - {{ statusText(item.status) }}
            </n-progress>
          </n-space>
        </div>

        <template #action>
          <div class="dialog-footer">
            <!-- <n-button @click="handleClose">取消</n-button> -->
            <n-button type="primary" @click="handleClose">关闭</n-button>
          </div>
        </template>
      </n-modal>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, defineProps, watch,computed,onMounted,toRaw  } from 'vue';
  import { NProgress, NAlert, NSpace, NModal, NCard, NButton, NList, 
    NListItem, NCollapseTransition,useDialog,NSwitch } from 'naive-ui';
  import { FileDownloadItem,DownloadProgress } from '@/shared/constants/dfconstants';
  interface DownloadItem {
    name: string;
    progress: number;
    status: 'downloading' | 'completed' | 'failed';
  }
  // const showDownloadModal = computed(() => props.filesToDownload?.length > 0);
  const showDownloadModal = ref(false);
  const downloadList = ref<DownloadItem[]>([]);
  const error = ref<string>('');
  const showDetails = ref(false);
  const dialog = useDialog(); 
  const handleClose = () => {
    dialog.warning({
        title: '确认关闭',
        content: '下载尚未完成，确定要关闭吗？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: () => {
          showDownloadModal.value = false;
        }
      });
    
  };
  
  // 状态文本映射
  const statusText = (status: DownloadItem['status']) => {
    const map: Record<DownloadItem['status'], string> = {
      completed: '下载完成',
      failed: '下载失败',
      downloading: '下载中'
    };
    return map[status] || '等待下载';
  };
  
  // 状态类型映射
  const mapStatus = (status: DownloadItem['status']) => {
    const statusMap: Record<DownloadItem['status'], 'success' | 'error' | undefined> = {
      completed: 'success',
      failed: 'error',
      downloading: undefined
    };
    return statusMap[status] || undefined;
  };
  
  // 开始下载流程
  const startDownload = async () => {
    try {
      if (!props.filesToDownload.length) {
        error.value = '没有需要下载的资源文件';
        showDownloadModal.value = false;
        return;
      }
  
      // 初始化下载列表
      downloadList.value = props.filesToDownload.map(file => ({
        name: file.name,
        progress: 0,
        status: 'downloading'
      }));
  
      // 创建进度更新处理函数
      const handleProgress = (progress: DownloadProgress) => {
        const index = downloadList.value.findIndex(item => item.name === progress.name);
        if (index !== -1) {
          downloadList.value[index].progress = Math.floor(progress.progress);
          downloadList.value[index].status = progress.status;
        }
      };
  
      // 注册进度监听
      await (window as any).window.electronAPI?.listenDownloadProgress(handleProgress);
  
      // 2. 逐个下载文件
      for (let i = 0; i < props.filesToDownload.length; i++) {
        const downInfo:FileDownloadItem = toRaw(props.filesToDownload[i]);
        console.log('downInfo类型是:', typeof(downInfo));
        // 执行下载
        console.log('准备开始下载文件:', JSON.stringify(downInfo));
        await (window as any).window.electronAPI?.downloadResourceFile(downInfo);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = `下载失败: ${err.message}`;
        console.error('资源下载错误:', err);
      } else {
        error.value = '下载失败: 未知错误';
        console.error('资源下载错误:', err);
      }
    } finally {
      // 移除进度监听
      await (window as any).window.electronAPI.removeDownloadProgressListener();
    }
  };
  
  // 通过props接收filesToDownload参数
  const showConfirm = ref(false);
const beforeClose = () => {
  // 二次确认逻辑
  showConfirm.value = true;
  return false; // 阻止默认关闭
};

 

const props = defineProps<{
    filesToDownload: FileDownloadItem[]
  }>();

  // 当props.filesToDownload变化时开始下载
  watch(() => props.filesToDownload, (newVal) => {
    if (newVal && newVal.length) {
      showDownloadModal.value =  props.filesToDownload?.length > 0 ?  true : false;
      startDownload();
    }
  }, { immediate: true });
    // onMounted(startDownload);
  </script>
  
  <style scoped>
  /* 保留原有样式 */
  p {
    color: blue;
  }
  </style>
  

  