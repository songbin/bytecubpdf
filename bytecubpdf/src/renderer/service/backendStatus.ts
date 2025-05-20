import { ref } from 'vue';

const backendReady = ref(false);
let checkInterval = 3000; // 初始检测间隔3秒
let statusCheckTimer: number | null = null;
const duration = ref(0);
const startCheckTime = ref(0);

const checkBackendStatus = async () => {
  try {
    
    const response = await window.fetch('http://localhost:8089/pdf/echo');
    
    if (response.status === 200 && !backendReady.value) {
      duration.value = Date.now() - startCheckTime.value;
      backendReady.value = true;
      checkInterval = 120000;
    }
  } catch (error) {
    console.error('检查后端状态失败:', error);
    if (!backendReady.value) {
      duration.value = Date.now() - startCheckTime.value;
    }
    backendReady.value = false;
  } finally {
    statusCheckTimer = window.setTimeout(checkBackendStatus, checkInterval);
  }
};

const startCheckingBackendStatus = () => {
  startCheckTime.value = Date.now();
  checkBackendStatus();
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}分${secs}秒` : `${seconds}秒`;
};

export {
  backendReady,
  startCheckingBackendStatus,
  duration,
  formatDuration
};