<template>
    <div>
        <n-upload directory-dnd action="http://localhost:8089/pdf/import" :multiple="false" :file-list="fileList"
            :data="uploadData" :disabled="isLoading" accept=".pdf,application/pdf,.jpg,.jpeg,.png,image/jpeg,image/png" class="upload-area"
            @before-upload="beforeUpload" @finish="handleUploadFinish" @error="handleUploadError"
            @change="handleFileChange">
            <n-upload-dragger class="upload-dragger">
                <div style="margin-bottom: 6px">
                    <n-icon size="24" :depth="3">
                        <CloudUpload />
                    </n-icon>
                </div>
                <n-text style="font-size: 14px">
                    {{ t('pdfts.main.uploadPdf.introHow') }}
                </n-text>
                <n-p depth="3" style="margin: 4px 0 0 0; font-size: 12px">
                    {{ t('pdfts.main.uploadPdf.carefull') }}
                </n-p>
                <n-p depth="3" style="margin: 4px 0 0 0; font-size: 12px">
                    支持格式: PDF, JPG, JPEG, PNG
                </n-p>
            </n-upload-dragger>
        </n-upload>
        <n-form ref="formRef" label-placement="left" :label-width="90">
          <n-flex vertical :style="{ gap: '8px' }">
            <n-flex class="form-section">
              <n-form-item :label="t('pdfts.main.tsform.platform')" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-select v-model:value="formData.platformId" :options="platforms"
                  :placeholder="t('pdfts.main.tsform.platformPlaceholder')" filterable @update:value="handlePlatformChange"
                  size="small" />
              </n-form-item>
              <n-form-item :label="t('pdfts.main.tsform.model')" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-select v-model:value="formData.modelId" :options="models"
                  :placeholder="t('pdfts.main.tsform.modelPlaceholder')" filterable size="small" />
            </n-form-item>
            </n-flex>
            <n-flex class="form-section">
             
              <n-form-item label="是否竖版" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                原始排版是否是竖版，不开启则表示是正常横板从左到右排布。
              </n-tooltip>
                <n-switch v-model:value="formData.enableVertical" size="small" />
              </n-form-item>
             
              <n-form-item label="启用断句" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                原始文档是文言文，可以开启断句功能，识别出来的文本会自动断句。
              </n-tooltip>
                <n-switch v-model:value="formData.enabaleSentence" size="small" />
              </n-form-item>

              <n-form-item label="繁转简" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                原始文档是文言文，使用繁体字，启用该功能后将会把繁体字转化为简体字。
              </n-tooltip>
                <n-switch v-model:value="formData.enableConvert" size="small" />
              </n-form-item>
              <n-form-item label="排版方向" :show-feedback="false" :style="{ marginBottom: 0 }">
                <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                默认从左到右
              </n-tooltip>
                <n-select v-model:value="formData.layoutDirection" :options="direct"
                  :placeholder="t('pdfts.main.tsform.layoutPlaceholder')" filterable size="small" />
              </n-form-item>
            </n-flex>

            <n-flex justify="end">
              <n-text :type="backendReady ? 'success' : 'warning'" size="small">
                <n-icon v-if="!backendReady" :depth="1">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </n-icon>
                <n-icon v-else color="#19be6b">
                  <CheckmarkCircle />
                </n-icon>
                {{ backendReady ? `服务已就绪` : `服务启动中...（${formatDuration(duration)}）` }}
              </n-text>
              <n-button attr-type="button" size="small" type="success" @click="handleConvert" :disabled="isLoading">
               开始
              </n-button>
              <n-button attr-type="button" size="small" type="error" @click="handleAbort" :disabled="!isLoading">
                {{ t('pdfts.main.tsform.buttons.stop') }}
              </n-button>
            </n-flex>
            <n-flex justify="center">
              <div class="status-message" :class="statusClass" v-if="statusMessage">
                <span>{{ statusMessage }}</span>
                <n-progress type="line" :percentage="progressPercentage" indicator-placement="inside"
                  :status="statusClass === 'error' ? 'error' : 'default'" :processing="statusClass === 'processing'" />
              </div>
            </n-flex>

              <!-- 新增日志显示区域 -->
            <n-flex justify="center">
            <div class="log-container">
                <n-infinite-scroll style="height: 100px">
                <n-log ref="logRef" :log="pluginLogs.join('\n')" />
                </n-infinite-scroll>
            </div>
            </n-flex>
          </n-flex>
        </n-form>
        <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/ocr.html" />
    </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { NUpload, NUploadDragger, NIcon, NText, NP } from 'naive-ui';
import { CloudUpload } from '@vicons/carbon';
import { UPLOAD_BIZ } from '@/renderer/constants/appconfig';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue' 
import { useMessage, UploadFileInfo } from 'naive-ui';
import { useRouter } from 'vue-router';
import { NTooltip, NSwitch, NLog, NInfiniteScroll, useDialog, NInputNumber, NFlex, NForm, NFormItem, NButton, NSelect, NProgress } from 'naive-ui';
import { CheckmarkCircle, HelpCircle } from '@vicons/ionicons5';
import { ref, onMounted, watch, nextTick } from 'vue';
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager';
import OcrRecIndexDb from '@/renderer/service/indexdb/OcrRecIndexDb';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { backendReady ,startCheckingBackendStatus, duration, formatDuration } from '@/renderer/service/backendStatus';
import { TranslateHistoryManager } from '@/renderer/service/manager/TranslateHistoryManager';
defineOptions({
  name: 'OcrRec'

})
const { t } = useI18n();
const message = useMessage();
const uploadData = ref<Record<string, any>>({});
const fileList = ref<UploadFileInfo[]>([]);
const isLoading = ref(false);
const historyManager = new TranslateHistoryManager();
const router = useRouter();
const dialog = useDialog();
const llmManager = new LlmModelManager();
const ocrRecIndexDb = new OcrRecIndexDb();
// 数据绑定
const formData = ref({ id: '', platformId: '', modelId: '', threadCount: 4, 
layoutDirection: 'left_to_right', enabaleSentence:false, enableVertical:false, enableConvert:false });
const translatedText = ref('');
const errorMessage = ref('');
const isTranslationCompleted = ref(false);
const progressVisible = ref(false);
const progressPercentage = ref(0);
const statusMessage = ref('');
const abortController = ref<AbortController | null>(null);
const statusClass = ref('');

const initLogListener = () => {
  try {
    pluginLogs.value = [];
    let timer: number;

    const fetchLogs = async () => {
      try {
        const logs = await (window as any).window.electronAPI?.getPluginLogs();
        const logsArray = Array.isArray(logs) ? logs : [logs];
        const stringLogs = logsArray.map(log => String(log));
        pluginLogs.value = stringLogs.slice(-1000);
      } catch (error) {
        console.error('获取日志时出错:', error);
      }
    };

    fetchLogs();
    timer = window.setInterval(fetchLogs, 1000);
  } catch (error) {
    console.error('初始化日志监听失败:', error);
  }
};
// 平台和模型数据
const platforms = ref<Array<{ value: string; label: string }>>([]);
const models = ref<Array<{ value: string; label: string }>>([]);
const direct = ref<Array<{ value: string; label: string }>>([
  { value: 'left_to_right', label: '从左到右' },
  { value: 'right_to_left', label: '从右到左' }
]);


const startCheckTime = ref<number>(Date.now());

// 初始化平台数据
onMounted(async () => {
  try {
    startCheckTime.value = Date.now();
    // 初始化日志监听
    initLogListener();
    console.log('加载配置开始');
    const cacheDir = await (window as any).window.electronAPI?.getCacheDirPath();
    uploadData.value = { cache_dir: cacheDir, biz: UPLOAD_BIZ.ocr };
    const config = await ocrRecIndexDb.getConfig();
    if (config) {
      formData.value = { ...formData.value, ...config };
      if (config.platformId) {
        await handlePlatformChange(config.platformId, false);
      }
    }
    const platformList = await llmManager.getPlatforms();
    platforms.value = platformList.map((p) => ({
      value: p.id,
      label: p.platformName,
    }));
  } catch (error) {
    console.error('加载配置失败:', error);
  }
  
  startCheckingBackendStatus();
});

watch(formData, (newValue) => {
  ocrRecIndexDb.saveConfig(newValue);
}, { deep: true });

const pluginLogs = ref<string[]>([]);
const logRef = ref<HTMLElement | null>(null);
const formRef = ref<HTMLElement | null>(null);
// 文件上传相关方法
const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
    const file = data.file.file;
    if (!file) return false;
    const isPDF = ['application/pdf', 'application/x-pdf', 'application/acrobat'].includes(file.type) || file.name.toLowerCase().endsWith('.pdf');
    const isImage = ['image/jpeg', 'image/png'].includes(file.type) || ['.jpg', '.jpeg', '.png'].some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isPDF && !isImage) {
        message.error('仅支持 PDF、JPG、JPEG 和 PNG 文件格式');
        return false;
    }
    return true;
};

const handleUploadFinish = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
    const response = (event?.target as XMLHttpRequest)?.response;
    try {
        const result = JSON.parse(response);
        if (result.code === 200) {
            message.success(`${file.name} 上传成功`);
            LocalStorageUtil.setPendingOcr(result.data);
        } else {
            message.error(result.msg || '文件上传失败');
        }
        return file;
    } catch (error) {
        console.error('解析上传响应失败:', error);
        message.error('上传响应解析失败');
        return file;
    }
};

const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFileInfo[] }) => {
    fileList.value = newFileList.length > 0 ? [newFileList[newFileList.length - 1]] : [];
};

const handleUploadError = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
    message.error(`${file.name} 上传失败`);
    console.error('上传错误:', event);
    return file;
};


// 平台选择变化处理
const handlePlatformChange = async (platformId: string, setting_model: boolean = true) => {
  const modelList = await llmManager.getVisonModelsByPlatform(platformId);
  models.value = modelList.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  if (!setting_model) {
    return; // 不更新 formData.modelId 以保持当前选择的 modelId 不变  
  }
  if (modelList.length > 0) {
    formData.value.modelId = modelList[0].id;
  } else {
    formData.value.modelId = '';
  }
};
const LocalStorageUtil = {
  setPendingOcr(filePath: string) {
    localStorage.setItem('pendingOcr', filePath);
  },
  getPendingOcr() {
    return localStorage.getItem('pendingOcr');
  },
  clearPendingOcr() {
    localStorage.removeItem('pendingOcr');
  },
}; 
const formatRequestData = async () => {
  let apiKey = '';
  let baseUrl = '';
  let protocolType = '';
  if (formData.value.platformId) {
    const platform = await llmManager.getPlatformBasicInfo(formData.value.platformId);
    if (platform) {
      apiKey = platform.apiKey || '';
      baseUrl = platform.apiUrl || '';
      protocolType = platform.protocolType || '';
    }
 
      
  }
  const cacheDir = await (window as any).window.electronAPI?.getCacheDirPath()
  // 获取术语列表并格式化
 
  return {
    platform: protocolType,
    model: formData.value.modelId,
    threads: formData.value.threadCount,
    apiKey: apiKey,
    file_path: LocalStorageUtil.getPendingOcr(),
    base_url: baseUrl,
    cache_dir: cacheDir, // 添加缓存目录到请求数据中
    layoutDirection: formData.value.layoutDirection,
    enabaleSentence: formData.value.enabaleSentence,
    enableVertical: formData.value.enableVertical,
    enableConvert: formData.value.enableConvert,
  };
}; 
// 开始转化
const handleConvert = async () => {
  // 表单验证
  if (!formData.value.platformId || !formData.value.modelId) {
    message.error('请选择平台和模型');
    return;
  }
  // 文件上传状态检查
  if (fileList.value.length === 0) {
    message.error('请上传文件');
    return;
  }
  // 新增API Key检查
  if (formData.value.platformId) {
    const platform = await llmManager.getPlatformBasicInfo(formData.value.platformId);
    if (!platform?.apiUrl || !platform?.apiKey) {
      message.error('当前平台未配置API地址或密钥，请先完成配置');
      dialog.warning({
        title: t('pdfts.main.platformConfigIncomplete'),
        content: t('pdfts.main.platformConfigIncompleteDesc'),
        positiveText: t('pdfts.main.goToSettings'),
        negativeText: t('pdfts.main.cancel'),
        onPositiveClick: () => {
          router.push({
            path: '/settings/model',
            query: { platformId: formData.value.platformId }
          });
        }
      });
      return;
    }
  }
  // 初始化状态
  isLoading.value = true;
  statusMessage.value = '转化中...';
  statusClass.value = 'processing';
  progressPercentage.value = 0;
  abortController.value = new AbortController();
  const startTime = ref<number>(Date.now()); 
  // 开始转化
  try {
    await fetchEventSource('http://localhost:8089/pdf/sse_chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await formatRequestData()),
      signal: abortController.value.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (!response.ok) {
          throw new Error('服务器返回错误状态');
        }
      },
      onmessage(ev) {
        // 处理返回的文本数据
        // 更新进度条和状态信息
        //判断下ev.data 如果是空，则直接不处理
        if (!ev.data) {
          console.log('sse_chat: ev.data is empty');
          return;
        }
        const data = JSON.parse(ev.data);

        const content_data = JSON.parse(data.data.content); // 假设 content_data 是一个 JSON 字符串
        const is_error = content_data.error;
        const progress = content_data.progress;
        const msg = content_data.msg;
        const timeUsed = Math.floor((Date.now() - startTime.value) / 1000);
        statusMessage.value =  `${msg} | 用时 ${timeUsed}s`;
        progressPercentage.value = progress;
        if(!is_error) {
          statusClass.value = 'processing';
        } else {
          statusClass.value = 'error';
          isLoading.value = false;
          statusMessage.value = `⚠️ 转换失败: ${msg}`;
          
        }
        if(progress === 100) {
          const serverTimeUsed = Math.floor((Date.now() - startTime.value) / 1000);
          statusMessage.value = `🎉 转换完成 | 总耗时 ${serverTimeUsed}s`;
          statusClass.value = 'success';
          isLoading.value = false;
          const md_file_path = content_data.md_file;
          const docx_file_path = content_data.docx_file;
          const source_file_path = content_data.source_file;
          const total_pages = content_data.total_pages;
          const file_type = content_data.file_type;
          
          const result = {
            md_file: md_file_path,
            docx_file: docx_file_path,
            source_file: source_file_path,
            time_used: serverTimeUsed,
            total_pages: total_pages,
            file_type: file_type
          };
          // historyManager.createHistory(history);
          formatHistoryParams(result).then(history => {
            historyManager.createHistory(history);
          });
        }
        
      },
      onclose() {
        // statusMessage.value = '转化完成';
        // statusClass.value = 'success';
      },
      onerror(err) {
        throw err;
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      statusMessage.value = '转化已终止';
      statusClass.value = 'error';
    } else {
      statusMessage.value = '转化失败';
      statusClass.value = 'error';
      console.error('转化失败:', error);
    }
  } finally {
    isLoading.value = false;
  }
  return;
};

const formatHistoryParams = async (resultData: any) => {
  // 获取平台和模型信息
  const platform = formData.value.platformId
    ? await llmManager.getPlatformBasicInfo(formData.value.platformId)
    : null;

  const model = formData.value.modelId
    ? await llmManager.getModel(formData.value.platformId, formData.value.modelId)
    : null;

  const params = {
    targetFile: '', 
    sourceLanguage: '', 
    targetLanguage: '', 
    translationEngine: '',
    platformId: formData.value.platformId || '',
    platformName: platform?.platformName || '',
    modelId: formData.value.modelId || '',
    modelName: model?.name || '',
    sourceFile: resultData.source_file,
    timeConsumed: resultData.time_used,
    totalPages: resultData.total_pages || 0,
    ext1: 'ocr',  // 用于业务识别，这里设置为ocr
    ext2: resultData.file_type,//存储上传文件类型，例如pdf、image等
    ext3: resultData.docx_file,//存储docx文件的路径
    ext4: resultData.md_file,//存储markdown文件的路径
    ext5: ''
  };
  return params;
};
// 终止转化
const handleAbort = () => {
  if (abortController.value) {
    abortController.value.abort();
    isLoading.value = false;
    statusMessage.value = '转化已终止';
    statusClass.value = 'error';
  }
}
 
</script>

<style scoped>
.upload-dragger {
    padding: 2px;
    /* max-height: 40px; */
    min-height: 60px;
}

.upload-area {
    height: 40%;
}
.status-message {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
}
.status-message.error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}
.status-message.processing {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}
.log-container {
  width: 100%;
  height: 100px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: auto;
}
</style>