<template>
  <div class="top-side-container">
    <div class="title">{{ title }}</div>
      <div class="right-container">
        <div class="right-section">
          
          <n-button text  @click="toUpgrade" v-if="isLongTimeNotice">
              <template #icon>
              <n-icon color="#d91a1a">
                <WarningFilled />
              </n-icon>
              </template>
              你的系统太陈旧了，请点击更新到最新版本
            </n-button>
          <n-button text  @click="restartApp" v-if="isUpgradeReady">
              <template #icon>
              <n-icon>
                <CloudDownload />
              </n-icon>
              </template>
              新版本已就绪，点击重启以更新
            </n-button>
          <n-button type="primary"  @click="visitOfficialWebsite">
              访问官网
            </n-button>
          <n-dropdown
            :options="helpOptions"
            @select="handleHelpSelect"
            placement="bottom-start"
            trigger="click"
          >
            <n-button text>
              帮助
              <n-icon><DownOutlined /></n-icon>
            </n-button>
          </n-dropdown>
          </div>
          <div class="window-controls">
            <button 
              class="control-btn minimize" 
              @click="minimizeWindow"
              aria-label="最小化窗口"
            >
              ─
            </button>
            <button 
              class="control-btn maximize" 
              @click="maximizeWindow"
              aria-label="最大化窗口"
            >
              □
            </button>
            <button 
              class="control-btn close" 
              @click="closeWindow"
              aria-label="关闭窗口"
            >
              ✕
            </button>
          </div>
      </div>

  
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted,computed,h,watchEffect } from 'vue' 
import VersionUpgradeModal from '@/renderer/components/update/VersionUpgradeModal.vue'
import { useVersionCheck } from '@/renderer/service/VersionCheck'
import { VERSION } from '@/shared/constants/dfconstants';
import {NDropdown, NButton, useDialog, NIcon} from 'naive-ui'
import { CloudDownload,WarningFilled } from '@vicons/carbon'
import { DownOutlined } from '@vicons/antd'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()
const { locale, t } = useI18n()
const { 
  checkForUpdates,
  upgradeInfo,
  isModalVisible,
  handleUpdate,
  closeModal
} = useVersionCheck()
const message = useMessage();
const title = ref<string>('小书芽 - 专为学术而生 DocFable.com')
const dialog = useDialog()
const helpOptions = [
  { 
    label: '关于我们', 
    key: 'about' 
  },
  { 
    label: '使用帮助', 
    key: 'intro' 
  },
  {
    label: '查看日志',
    key: 'view-log' 
  },
  { 
    label: '系统支持', 
    key: 'system-support' 
  },
  { 
    label: '数据收集', 
    key: 'data-collection' 
  },
  { 
    label: '版本检查', 
    key: 'version-check' 
  }
]
const languageOptions = [
  { label: '中文', key: 'zh-cn' },  
  { label: 'English', key: 'en-us' }
]
const currentLanguage = computed(() => {
  return languageOptions.find(opt => opt.key === locale.value)?.label || '中文'
})
const isUpgradeReady = ref(false);
const isLongTimeNotice = ref(false);
 
const handleLanguageSelect = (key: string) => {
  console.log('语言切换:', key)
  locale.value = key // 直接修改locale会触发全局更新
}
const restartApp = async (e: MouseEvent) => {
  console.log('准备重启升级应用')
  if ((window as any).window.electronAPI) {
    await (window as any).window.electronAPI.updateLauchInstaller('');
  }
  console.log('重启升级应用成功')
} 
const toUpgrade = async (e: MouseEvent) => {
  dialog.info({
        title: '版本更新',
        content: () => h(VersionUpgradeModal, {
          currentVersion: VERSION?.version,
          upgradeInfo: upgradeInfo.value,
          onUpgrade: handleUpdate,
          onClose: closeModal
        }),
        negativeText: '去下载',  // 修改为提醒按钮
        positiveText: '稍后提醒',     // 新增下载按钮
        showIcon: false,
        onNegativeClick: handleUpdate  // 绑定下载事件
      })
      checkForUpdates()
}
const visitOfficialWebsite = async (e: MouseEvent) => {
  if ((window as any).window.electronAPI) {
        await (window as any).window.electronAPI.openExternal('https://www.docfable.com/');
  }
} 
const handleHelpSelect = async (key: string) => {
  switch(key) {
    case 'about':
      dialog.info({
        title: '✨ 关于作者 ✨',
        content: () => h('div', { 
          style: 'white-space: pre-line;' 
        }, '白天搬砖打工人，晚上化身代码侠💻\n☕ 用咖啡续命，用爱发电做开发\n🌱 每条用户反馈都认真记录\n🚀 虽然更新慢（毕竟要恰饭嘛）\n但依然会全力以赴优化功能！\n感谢每个支持的你让这个小软件发光~'),
         positiveText: '确认'
      });
      break;
    case 'intro':
      router.push('/about')
      break;
    case 'view-log':
    try {
        const logDir = await (window as any).window.electronAPI?.getLogDirPath();
        await (window as any).window.electronAPI?.openPath(logDir);
      } catch (error) {
        message.error(`打开日志目录失败: ${error instanceof Error ? error.message : String(error)}`);
      } 
      break;
    case 'system-support':
      dialog.warning({
        title: '系统支持',
        content: '只支持win10以及以上windows版本',
        positiveText: '确定'
      });
      break;
    case 'data-collection':
      dialog.warning({
        title: '数据收集',
        content: '软件嵌入了百度统计和51啦统计,除此之外再没有其他收集信息的地方了。',
        positiveText: '确定'
      });
      break;
    case 'version-check':
    dialog.info({
        title: '版本更新',
        content: () => h(VersionUpgradeModal, {
          currentVersion: VERSION?.version,
          upgradeInfo: upgradeInfo.value,
          onUpgrade: handleUpdate,
          onClose: closeModal
        }),
        negativeText: '去下载',  // 修改为提醒按钮
        positiveText: '稍后提醒',     // 新增下载按钮
        showIcon: false,
        onNegativeClick: handleUpdate  // 绑定下载事件
      })
      checkForUpdates()
      break
  }
}

const showAboutDialog = () => {
  dialog.info({
    title: '关于我们',
    content: '小书芽 PDF 工具\n版本：0.3.0\n版权所有 © 2025',
    positiveText: '确定'
  })
}
const setTitle = (newTitle: string): void => {
  title.value = newTitle
}
onMounted(() => {
  if ((window as any).window.electronAPI) {
    console.log('当前平台:', (window as any).window.electronAPI.platform)
  } else {
    console.warn('Electron API 不可用')
  }
  
  setInterval(async () => {
    try {
      isUpgradeReady.value = await (window as any).window.electronAPI.getUpgradeStatus();
      isLongTimeNotice.value = await (window as any).window.electronAPI.getLongTimeNotice();
      const downPath = await (window as any).window.electronAPI.getUpgradeDownPath();
      console.log('检查升级状态:', isUpgradeReady.value  ,'升级路径:', downPath, '长时间未升级:', isLongTimeNotice.value)
    } catch (error) {
      console.error('升级状态检查失败:', error);
    }
  }, 10000);
})
const minimizeWindow = async (): Promise<void> => {
  try {
    await (window as any).window.electronAPI?.minimizeWindow()
  } catch (error) {
    console.error('最小化窗口失败:', error)
  }
}

const maximizeWindow = async (): Promise<void> => {
  try {
    await (window as any).window.electronAPI?.maximizeWindow()
  } catch (error) {
    console.error('最大化窗口失败:', error)
  }
}

const closeWindow = async (): Promise<void> => {
  try {
    await (window as any).window.electronAPI?.closeWindow()
  } catch (error) {
    console.error('关闭窗口失败:', error)
  }
}


</script>

<style scoped>
.right-container {
  display: flex;
  align-items: center;
  gap: 20px; /* 控制两个区域间距 */
}
.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
  -webkit-app-region: no-drag;
}
.top-side-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.title {
  font-size: 16px;
  font-weight: bold;
  color: inherit; /* 继承父元素颜色 */
  -webkit-app-region: drag; /* 标题区域也可拖动 */
  padding: 0 10px; /* 添加内边距 */
}


.window-controls {
  display: flex;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background-color: #34495e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: background-color 0.2s ease;
}

.control-btn.close {
  background-color: #e74c3c;
}

.control-btn.close:hover {
  background-color: #c0392b;
}

.control-btn:not(.close):hover {
  background-color: #2c3e50;
}
</style>

<!-- <script setup>
import { ref, watchEffect } from 'vue';
import { UpgradeService } from '@/shared/services/UpgradeService';

const isUpgradeReady = ref(UpgradeService.getUpgradeStatus());

// 监听UpgradeService状态变化
watchEffect(() => {
  isUpgradeReady.value = UpgradeService.getUpgradeStatus();
});
</script> -->
