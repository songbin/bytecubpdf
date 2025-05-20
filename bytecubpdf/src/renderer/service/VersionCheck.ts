import { ref, computed } from 'vue'
import axios from 'axios'
import { useMessage, useDialog } from 'naive-ui'
import { VERSION } from '@/renderer/constants/appconfig.js'

interface UpgradeInfo {
  version: string;
  build_number: number;
  force_update: boolean;
  changelog: string[];
  download_url: string;
}

export const useVersionCheck = () => {
  const message = useMessage()
  const dialog = useDialog()
  const upgradeInfo = ref<UpgradeInfo | null>(null)
  const isModalVisible = ref(false)

  const checkForUpdates = async (): Promise<void> => {
    try {
      const timestamp = Date.now() // 添加时间戳防止缓存
      const api_version = 'https://api.docfable.com/version/version.json' + '?t=' + timestamp // 添加时间戳参数
      const { data } = await axios.get<UpgradeInfo>(api_version, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
       
      if (data.build_number > VERSION.buildNumber) {
        upgradeInfo.value = data
        isModalVisible.value = true
        if (data.force_update) document.body.style.overflow = 'hidden'
      }else if (data.build_number <= VERSION.buildNumber) {
        // message.success(`当前已是最新版本 (${VERSION.version})`)
        upgradeInfo.value = data // 设置最新版本信息用于显示
        isModalVisible.value = true // 显示弹窗
      }
    } catch (error: any) {
      message.error('版本检查失败，请检查网络连接')
    }
  }
  const handleUpdate = async (): Promise<void> => {
    if (!upgradeInfo.value) return;
    
    try {
      if ((window as any).electronAPI?.openExternal) {
        await (window as any).electronAPI.openExternal(upgradeInfo.value.download_url);
      } else {
        window.open(upgradeInfo.value.download_url, '_blank');
      }
    } catch (error: any) { 
      message.error('无法打开下载链接，请稍后重试');
    }
  };

  const closeModal = (): void => {
    if (upgradeInfo.value?.force_update) {
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

  return {
    checkForUpdates,
    upgradeInfo,
    isModalVisible,
    handleUpdate,  // 添加升级操作
    closeModal     // 添加关闭弹窗方法
  }
}