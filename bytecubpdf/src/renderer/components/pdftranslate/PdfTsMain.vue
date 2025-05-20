<template>
  <div>
    <n-upload directory-dnd action="http://localhost:8089/pdf/import" :multiple="false" :file-list="fileList"
      :data="uploadData" :disabled="isLoading" accept=".pdf,application/pdf" class="upload-area"
      @before-upload="beforeUpload" @finish="handleUploadFinish" @error="handleUploadError" @change="handleFileChange">
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
      </n-upload-dragger>
    </n-upload>
    <n-form ref="formRef" label-placement="left" :label-width="90">
      <n-flex vertical :style="{ gap: '8px' }">
        <n-flex class="form-section">
          <n-form-item :label="t('pdfts.main.tsform.sourceLang')" :show-feedback="false" :style="{ marginBottom: 0 }">
            <n-select v-model:value="formData.sourceLang" :options="languages"
              :placeholder="t('pdfts.main.tsform.sourceLangPlaceholder')" filterable size="small" />
          </n-form-item>
          <n-form-item :label="t('pdfts.main.tsform.targetLang')" :show-feedback="false" :style="{ marginBottom: 0 }">
            <n-select v-model:value="formData.targetLang" :options="languages"
              :placeholder="t('pdfts.main.tsform.targetLangPlaceholder')" filterable size="small" />
          </n-form-item>
        </n-flex>
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
        <n-flex class="form-section" vertical>
          <n-flex>
            <n-form-item :label="t('pdfts.main.tsform.engine')" :show-feedback="false" :style="{ marginBottom: 0 }">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                BabelDoc质量更好,PDFMath速度更快
              </n-tooltip>
              <n-select v-model:value="formData.engine" :options="translateEngines"
                :placeholder="t('pdfts.main.tsform.enginePlaceholder')" filterable @update:value="handleEngineChange"
                size="small" />
            </n-form-item>
            <n-form-item :label="t('pdfts.main.tsform.thread')" :show-feedback="false" :style="{ marginBottom: 0 }">
              <n-input-number v-model:value="formData.threadCount" style="width: 160px"
                :placeholder="t('pdfts.main.tsform.threadPlaceholder')" size="small" />
            </n-form-item>
            <n-form-item label="启用术语" :show-feedback="false" :style="{ marginBottom: 0 }">
              <n-switch v-model:value="formData.enableTerms" @update:value="handleTermsSwitchChange" size="small" />
            </n-form-item>
          </n-flex>
          <n-flex  v-if="formData.engine === 'babeldoc'"
            style="background-color: #f5f5ff; border-radius: 8px;">
           
           
            <n-form-item label="翻译表格" :show-feedback="false" :style="{ marginBottom: 0 }">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                翻译表格文本（实验性）
              </n-tooltip>
              <n-switch v-model:value="formData.enableTable" size="small" />
            </n-form-item>
            <n-form-item label="禁用富文本" :show-feedback="false" :style="{ marginBottom: 0 }">
              <n-tooltip trigger="hover">
                <template #trigger>
                  <n-icon size="large">
                    <HelpCircle />
                  </n-icon>
                </template>
                是否禁用富文本翻译（可能有助于提高某些 PDF 的兼容性）
              </n-tooltip>
              <n-switch v-model:value="formData.disableRichText" size="small" />
            </n-form-item>
          </n-flex>
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
            <!-- {{ backendReady ? '服务已就绪' : '服务启动中...' }} -->

            {{ backendReady ? `服务已就绪` : `服务启动中...（${formatDuration(duration)}）` }}

          </n-text>
          <n-button attr-type="button" size="small" type="success" @click="handleTranslate" :disabled="isLoading">
            {{ t('pdfts.main.tsform.buttons.translate') }}
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

   
     
      <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/translatepdf.html" />
     
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'PdfTsMain'
})
import { useRouter } from 'vue-router';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'
import {
  NTooltip,
  NSwitch,
  NLog,
  NInfiniteScroll,
  useDialog,
  useMessage,
  UploadFileInfo,
  NUpload,
  NInputNumber,
  NUploadDragger,
  NFlex,
  NText,
  NIcon,
  NP,
  NForm,
  NFormItem,
  NButton,
  NSelect,
  NProgress,
} from 'naive-ui';
import { CloudUpload } from '@vicons/carbon';
import { useI18n } from 'vue-i18n';
import { CheckmarkCircle,HelpCircle } from '@vicons/ionicons5';
import { ref, onMounted, watch, nextTick } from 'vue';
import { LlmModelManager } from '@/renderer/service/manager/LlmModelManager';
import PdfTsIndexDb from '@/renderer/service/indexdb/PdfTsIndexDb';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { translateTermManager } from '@/renderer/service/manager/TranslateTermManager';
import { termsService } from '@/renderer/service/translate/TermsService';
import { TranslateHistoryManager } from '@/renderer/service/manager/TranslateHistoryManager';
const historyManager = new TranslateHistoryManager();
const { t } = useI18n();
const router = useRouter();
const dialog = useDialog();
const llmManager = new LlmModelManager();
const pdfTsIndexDb = new PdfTsIndexDb();
const message = useMessage();
const uploadData = ref<Record<string, any>>({});
import { UPLOAD_BIZ } from '@/renderer/constants/appconfig'
// 数据绑定
const formData = ref({
  sourceLang: '',
  targetLang: '',
  platformId: '',
  modelId: '',
  engine: 'babeldoc',
  threadCount: 4,
  enableTerms: false, // 新增术语开关字段
  maxPages: 0, // 新增每页最大页数字段
  enableOCR: false,  // 新增OCR识别字段
  disableRichText: false,  // 新增禁用富文字段
  enableTable: false,  // 新增表格翻译字段

});
const fileList = ref<UploadFileInfo[]>([]);
const translatedText = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const isTranslationCompleted = ref(false);
const progressVisible = ref(false);
const progressPercentage = ref(0);
const statusMessage = ref('');
const abortController = ref<AbortController | null>(null);
const statusClass = ref('');
const startTime = ref<number>(Date.now());
const startCheckTime = ref<number>(Date.now());

// 平台和模型数据
const platforms = ref<Array<{ value: string; label: string }>>([]);
const models = ref<Array<{ value: string; label: string }>>([]);
import { backendReady, startCheckingBackendStatus, duration, formatDuration } from '@/renderer/service/backendStatus';

// 初始化平台数据
onMounted(async () => {
  try {
    startCheckTime.value = Date.now();
    // 初始化日志监听
    initLogListener();
    console.log('加载配置开始'); // 添加日志
    const cacheDir = await (window as any).window.electronAPI?.getCacheDirPath();
    uploadData.value = { cache_dir: cacheDir , biz: UPLOAD_BIZ.ocr};
    await pdfTsIndexDb;
    const config = await pdfTsIndexDb.getConfig();
    if (config) {
      formData.value = {
        sourceLang: config.sourceLang || '',
        targetLang: config.targetLang || '',
        platformId: config.platformId || '',
        modelId: config.modelId || '',
        engine: config.engine || '',
        threadCount: config.threadCount || 4,
        enableTerms: config.enableTerms || false,
        maxPages: config.maxPages || 0, // 新增每页最大页数字段
        enableOCR: config.enableOCR || false,  // 新增OCR识别字段
        disableRichText: config.disableRichText || false,  // 新增富文字段
        enableTable: config.enableTable || false,  // 新增表格翻译字段
      };
      if (config.platformId) {
        await handlePlatformChange(config.platformId);
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
const initLogListener = () => {
  try {
    pluginLogs.value = [];
    let timer: number;

    const fetchLogs = async () => {
      try {
        const logs = await (window as any).window.electronAPI?.getPluginLogs();
        const logsArray = Array.isArray(logs) ? logs : [logs];
        const stringLogs = logsArray.map(log => String(log));
        pluginLogs.value = stringLogs.slice(-1000); // 限制最多1000条日志
      } catch (error) {
        console.error('获取日志时出错:', error);
      }
    };

    // 立即获取一次日志
    fetchLogs();

    // 设置定时器，每1秒获取一次日志
    timer = window.setInterval(fetchLogs, 1000);


  } catch (error) {
    console.error('初始化日志监听失败:', error);
  }
};
// 监听表单数据变化并保存到本地数据库
watch(
  formData,
  async (newValue) => {
    await pdfTsIndexDb.saveConfig({
      id: 'currentConfig',
      sourceLang: newValue.sourceLang,
      targetLang: newValue.targetLang,
      platformId: newValue.platformId,
      modelId: newValue.modelId,
      engine: newValue.engine,
      threadCount: newValue.threadCount,
      enableTerms: newValue.enableTerms, // 新增
      maxPages: newValue.maxPages, // 新增
      enableOCR: newValue.enableOCR, // 新增
      disableRichText: newValue.disableRichText, // 新增
      enableTable: newValue.enableTable, // 新增
    });
  },
  { deep: true }
);

// 处理平台切换
const handlePlatformChange = async (platformId: string) => {
  const modelList = await llmManager.getModelsByPlatform(platformId);
  models.value = modelList.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  if (modelList.length > 0) {
    formData.value.modelId = modelList[0].id;
  } else {
    formData.value.modelId = '';
  }
};

// 文件上传相关方法
const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) => {
  const file = data.file.file;
  if (!file) return false;
  const isPDF =
    ['application/pdf', 'application/x-pdf', 'application/acrobat'].includes(file.type) ||
    file.name.toLowerCase().endsWith('.pdf');
  if (!isPDF) {
    message.error('仅支持 PDF 文件格式');
    return false;
  }
  // 新增路径长度校验
  const uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
  const fullPath = await (window as any).window.electronAPI?.pathJoin(uploadDir, file.name);
  console.log('完整路径:', fullPath); // 打印完整路径
  if (fullPath.length > 200) {
    message.error(`上传保存路径太长（${fullPath.length}/200），请缩短文件名`);
    fileList.value = []; // 清空文件列表
    return false;
  }
  return true;
};

const LocalStorageUtil = {
  setPendingTranslation(filePath: string) {
    localStorage.setItem('pendingTranslation', filePath);
  },
  getPendingTranslation() {
    return localStorage.getItem('pendingTranslation');
  },
  clearPendingTranslation() {
    localStorage.removeItem('pendingTranslation');
  },
};

const handleUploadFinish = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  const response = (event?.target as XMLHttpRequest)?.response;
  try {
    const result = JSON.parse(response);
    if (result.code === 200) {
      message.success(`${file.name} 上传成功`);
      LocalStorageUtil.setPendingTranslation(result.data);
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
  // 新增状态重置
  progressPercentage.value = 0;
  statusMessage.value = '';
  statusClass.value = '';
  isLoading.value = false;
  errorMessage.value = '';
};

const handleUploadError = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  message.error(`${file.name} 上传失败`);
  console.error('上传错误:', event);
  return file;
};

// 翻译引擎选项
const languages = [
  { value: 'zh', label: t('pdfts.main.languages.zh') },
  { value: 'zh-TW', label: t('pdfts.main.languages.zh-TW') },
  { value: 'en', label: t('pdfts.main.languages.en') },
  { value: 'fr', label: t('pdfts.main.languages.fr') },
  { value: 'de', label: t('pdfts.main.languages.de') },
  { value: 'ja', label: t('pdfts.main.languages.ja') },
  { value: 'ko', label: t('pdfts.main.languages.ko') },
  { value: 'ru', label: t('pdfts.main.languages.ru') },
  { value: 'es', label: t('pdfts.main.languages.es') },
  { value: 'it', label: t('pdfts.main.languages.it') },
];
const translateEngines = [
  { value: 'pdfmath', label: 'PDFMath' },
  { value: 'babeldoc', label: 'BabelDoc' },
];
const handleEngineChange = (value: string) => {
  if (value === 'pdfmath') {
     
  }
};
// 格式化请求数据
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
  let termsResponse = null
  if (formData.value.enableTerms) {
    termsResponse = await termsService.getTerms().catch(err => {
      console.error('获取术语列表失败:', err);
      return new Map();
    });
  }

  console.log('获取的术语列表:', termsResponse); // 打印获取的术语列表

  return {
    sourceLanguage: formData.value.sourceLang,
    targetLanguage: formData.value.targetLang,
    platform: protocolType,
    model: formData.value.modelId,
    translate_engine: formData.value.engine,
    threads: formData.value.threadCount,
    apiKey: apiKey,
    file_path: LocalStorageUtil.getPendingTranslation(),
    base_url: baseUrl,
    cache_dir: cacheDir, // 添加缓存目录到请求数据中
    term_dict: termsResponse,
    max_pages: formData.value.maxPages, // 新增每页最大页数字段
    enable_ocr: formData.value.enableOCR,  // 新增OCR识别字段
    disable_rich_text: formData.value.disableRichText,  // 新增富文字段
    enable_table: formData.value.enableTable,  // 新增表格翻译字段
  };
};
// 在 handleTranslate 方法之前添加
const formatHistoryParams = async (resultData: any) => {
  // 获取平台和模型信息
  const platform = formData.value.platformId
    ? await llmManager.getPlatformBasicInfo(formData.value.platformId)
    : null;

  const model = formData.value.modelId
    ? await llmManager.getModel(formData.value.modelId)
    : null;

  
  const params = {
    platformId: formData.value.platformId || '',
    platformName: platform?.platformName || '',
    modelId: formData.value.modelId || '',
    modelName: model?.name || '',
    sourceFile: resultData.source,
    targetFile: resultData.target,
    sourceLanguage: formData.value.sourceLang,
    targetLanguage: formData.value.targetLang,
    timeConsumed: resultData.time_used || Math.floor((Date.now() - startTime.value) / 1000),
    totalPages: resultData.total_pages || 0,
    translationEngine: resultData.core,
    ext1: 'pdf',  // 用于业务识别，这里设置为ocr
    ext2: '',
    ext3: '',
    ext4: '',
    ext5: ''
  };
  return params;
};

// 修改翻译完成的处理逻辑
// 开始翻译任务
const handleTranslate = async () => {
  console.log('开始翻译任务'); // 添加日志
  if (fileList.value.length === 0) {
    message.error('请先上传PDF文件');
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

  // 原有翻译逻辑保持不变
  try {
    isLoading.value = true;
    progressVisible.value = true;
    progressPercentage.value = 0;
    startTime.value = Date.now();
    statusMessage.value = '正在初始化翻译任务...';
    statusClass.value = 'processing';

    if (abortController.value) {
      abortController.value.abort();
    }
    abortController.value = new AbortController();

    await fetchEventSource('http://localhost:8089/pdf/translate', {
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
      onmessage(event) {
        const data = JSON.parse(event.data);
        if (data.status === 'processing') {
          const timeUsed = Math.floor((Date.now() - startTime.value) / 1000);
          const remainingTime = data.progress > 0 ? Math.floor((100 - data.progress) * timeUsed / data.progress) : 0;

          if (data.core === 'pdfmath') {
            if (data.progress >= 90) {
              statusMessage.value = '正在生成翻译文件...';
            } else {
              statusMessage.value = `已翻译 ${data.progress}% | 用时 ${timeUsed}s | 剩余约 ${remainingTime}s`;
            }
          } else if (data.core === 'babeldoc') {
            const stage = data.stage || '未知阶段';
            const currentPage = data.current_page || '?';
            const totalPages = data.total_pages || '?';
            statusMessage.value = `已翻译 ${data.progress}% | ${stage}(${currentPage}/${totalPages}) | 用时 ${timeUsed}s`;
          }

          progressPercentage.value = data.progress;
          statusClass.value = 'processing';
        } else if (data.status === 'completed') {
          const serverTimeUsed = data.time_used || Math.floor((Date.now() - startTime.value) / 1000);
          const totalPages = data.result.total_pages || 1;
          const speed = (totalPages / serverTimeUsed).toFixed(1);
          const speedPerPage = (serverTimeUsed / totalPages).toFixed(1);

          translatedText.value = data.result;
          isTranslationCompleted.value = true;
          progressPercentage.value = 100;
          statusMessage.value = `🎉 翻译完成 | 总耗时 ${serverTimeUsed}s | 均速 ${speed}页/秒 | 每页耗时 ${speedPerPage}s`;
          statusClass.value = 'success';
          abortController.value = null;

          // 在翻译完成处理逻辑中修改为：
          formatHistoryParams(data.result).then(history => {
            historyManager.createHistory(history);
          });
          console.log('翻译完成:', data);
        } else if (data.status === 'error') {
          errorMessage.value = data.message;
          statusMessage.value = `⚠️ 翻译失败: ${data.message}`;
          statusClass.value = 'error';
          abortController.value?.abort();
        }
      },
      onerror(err) {
        errorMessage.value = err.message;
        statusMessage.value = `⚠️ 连接服务器失败: ${err.message}`;
        statusClass.value = 'error';
        abortController.value?.abort();
      },
    });
  } finally {
    isLoading.value = false;
  }
};

// 终止翻译任务
const handleAbort = () => {
  if (abortController.value) {
    console.log('终止翻译任务');
    abortController.value.abort();
    statusMessage.value = '⏹️ 翻译已手动终止';
    statusClass.value = 'error';
    abortController.value = null;
  }
};
const handleTermsSwitchChange = async (value: boolean) => {
  if (value) {
    dialog.info({
      title: '提示',
      content: '术语管理功能测试中，体验性使用',
      positiveText: '确定',
      onPositiveClick: () => {
        formData.value.enableTerms = true;
      },
      onNegativeClick: () => {
        formData.value.enableTerms = false;
      }
    });
  }
};
// 新增日志相关代码
const pluginLogs = ref<string[]>([]);
const logRef = ref<any>(null); // 新增日志组件引用

watch(pluginLogs, async () => {
  await nextTick();
  logRef.value?.scrollTo({ position: 'bottom' });
});

</script>

<style scoped>
:deep(.form-section) {
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
  background-color: rgba(250, 250, 252, 0.8);
  width: 100%;
  padding: 5px 8px; /**内边距上下5px，左右8px*/
  
  
}

:deep(.n-form-item .n-form-item-feedback-wrapper) {
  min-height: 0 !important;
}

.upload-area {
  height: 40%;
}

.upload-dragger {
  padding: 2px;
  /* max-height: 40px; */
  min-height: 60px;
}

.status-message {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
}

.progress-container {
  margin-top: 5px;
}

/* 新增日志容器样式 */
.log-container {
  width: 100%;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 8px;
  background-color: #fafafa;
  margin-top: 2px;
}
</style>
