import { ref, computed } from 'vue'
import axios from 'axios'
import { useMessage, useDialog } from 'naive-ui'
import { VERSION } from '@/shared/constants/dfconstants';
// interface UpgradeInfo {
//   version: string;
//   build_number: number;
//   force_update: boolean;
//   changelog: string[];
//   download_url: string;
// }

interface UpgradeInfo {
  version: string;
  buildNumber: number;
  files: Array<{
    url: string;
  }>;
  sha512: string;
  size: number;
  releaseDate: string;
  minBuildNumber: number;
  changelog: string[];
  downloadUrl: string;
  forceUpdate: boolean;
}

export const useVersionCheck = () => {
  const message = useMessage()
  const dialog = useDialog()
  const upgradeInfo = ref<UpgradeInfo | null>(null)
  const isModalVisible = ref(false)

  const checkForUpdates = async (): Promise<void> => {
    try {
      const timestamp = Date.now() // 添加时间戳防止缓存
      const api_version = 'http://api.docfable.com/upgrade/latest-win.json' + '?t=' + timestamp // 添加时间戳参数
      const { data } = await axios.get<UpgradeInfo>(api_version, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
       
      if (data.buildNumber > VERSION.buildNumber) {
        upgradeInfo.value = data
        isModalVisible.value = true
        if (data.forceUpdate) document.body.style.overflow = 'hidden'
      }else if (data.buildNumber <= VERSION.buildNumber) {
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
        await (window as any).electronAPI.openExternal(upgradeInfo.value.downloadUrl);
      } else {
        window.open(upgradeInfo.value.downloadUrl, '_blank');
      }
    } catch (error: any) { 
      message.error('无法打开下载链接，请稍后重试');
    }
  };

  const closeModal = (): void => {
    if (upgradeInfo.value?.forceUpdate) {
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