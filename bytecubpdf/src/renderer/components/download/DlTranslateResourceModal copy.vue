<template>
    <div>
      <n-modal v-model:show="showDownloadModal" :mask-closable="false">
        <n-card style="width: 600px" title="资源下载" :bordered="false" size="huge">
          <template #header-extra>
            {{ filesToDownload?.length }} 个文件需要下载
          </template>
          <n-alert v-if="error" type="error">{{ error }}</n-alert>
          <n-space vertical>
            <n-progress
              v-for="(item, index) in downloadList"
              :key="index"
              type="line"
              :percentage="item.progress"
              :status="mapStatus(item.status)"
            >
              {{ item.name }} - {{ statusText(item.status) }}
            </n-progress>
          </n-space>
        </n-card>
      </n-modal>

      <n-alert v-if="error" type="error">{{ error }}</n-alert>
      <n-space vertical>
        <n-progress
          v-for="(item, index) in downloadList"
          :key="index"
          type="line"
          :percentage="item.progress"
          :status="mapStatus(item.status)"
        >
          {{ item.name }} - {{ statusText(item.status) }}
        </n-progress>
      </n-space>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, defineProps, watch,computed,onMounted } from 'vue';
  import { NProgress, NAlert, NSpace, NModal, NCard } from 'naive-ui';
  import { FileDownloadItem,DownloadProgress } from '@/shared/constants/dfconstants';
  interface DownloadItem {
    name: string;
    progress: number;
    status: 'downloading' | 'completed' | 'failed';
  }
  const showDownloadModal = computed(() => props.filesToDownload?.length > 0);
  const downloadList = ref<DownloadItem[]>([]);
  const error = ref<string>('');
  
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
      // 1. 检查需要下载的文件
      //const filesToDownload:FileDownloadItem[] = await (window as any).window.electronAPI.verifyFileDownloads();
      
      if (!props.filesToDownload.length) {
        error.value = '没有需要下载的资源文件';
        return;
      }
  
      // 初始化下载列表
      downloadList.value = props.filesToDownload.map(file => ({
        name: file.name,
        progress: 0,
        status: 'downloading'
      }));
  
      // 2. 逐个下载文件
      for (let i = 0; i < props.filesToDownload.length; i++) {
        const file = props.filesToDownload[i];
        
        // 使用闭包捕获当前索引
        const updateProgress = (progress: DownloadProgress) => {
          if (progress.name === file.name) {
            downloadList.value[i].progress = Math.floor(progress.progress);
            downloadList.value[i].status = progress.status;
          }
        };
        
        // 注册进度监听
        const unsubscribe = (window as any).window.electronAPI.listenDownloadProgress(updateProgress);
  
        // 执行下载
        await (window as any).window.electronAPI.downloadFile(file);
        
      }
      await (window as any).window.electronAPI.removeDownloadProgressListener();
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = `下载失败: ${err.message}`;
        console.error('资源下载错误:', err);
      } else {
        error.value = '下载失败: 未知错误';
        console.error('资源下载错误:', err);
      }
    }
  };
  
  // 通过props接收filesToDownload参数
  const props = defineProps<{
    filesToDownload: FileDownloadItem[]
  }>();

  // 当props.filesToDownload变化时开始下载
  watch(() => props.filesToDownload, (newVal) => {
    if (newVal && newVal.length) {

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
  

  