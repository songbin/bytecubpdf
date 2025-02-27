<template>
  <t-layout style="padding: 1">
    <t-content>
      <t-card>
        <t-row :gutter="24">
          <!-- 左侧：选项区域（占 1/6） -->
          <t-col :span="4">
            <!-- 上传文件区域 -->
            <t-upload
              v-model="files"
              :auto-upload="autoUpload"
              theme="file"
              :data="{ extra_data: 'pdf_translate' }"
              :abridge-name="[10, 8]"
              :format-response="formatResponse"
              accept=".pdf"
              draggable
              action="http://localhost:8089/pdf/import"
              @change="handleFileChange"
              @success="handleSuccess"
              @remove="handleRemove"
              @fail="handleError"
            >
              <template #default>
                <t-icon name="upload" />
                <p>点击或拖拽 PDF 文件到此处上传</p>
              </template>
            </t-upload>

            <!-- 表单区域 -->
            <t-form :model="form" label-width="100px" style="margin-top: 24px;">
              <t-form-item label="源语言">
                <t-select v-model="form.sourceLanguage" placeholder="请选择源语言">
                  <t-option v-for="lang in languages" :key="lang.value" :label="lang.label" :value="lang.value" />
                </t-select>
              </t-form-item>
              <t-form-item label="目标语言">
                <t-select v-model="form.targetLanguage" placeholder="请选择目标语言">
                  <t-option v-for="lang in languages" :key="lang.value" :label="lang.label" :value="lang.value" />
                </t-select>
              </t-form-item>
              <t-form-item label="翻译平台">
                <t-select v-model="form.platform" @change="handlePlatformChange">
                  <t-option v-for="platform in platforms" :key="platform.value" :label="platform.label" :value="platform.value" />
                </t-select>
              </t-form-item>
              <t-form-item label="模型">
                <t-select v-model="form.model" placeholder="请选择模型">
                  <t-option v-for="model in models" :key="model.value" :label="model.label" :value="model.value" />
                </t-select>
              </t-form-item>
              <t-form-item label="API 密钥">
                <t-input v-model="form.apiKey" placeholder="请输入 API 密钥" />
              </t-form-item>
              <t-form-item>
                <div class="button-group">
                  <t-button theme="default" @click="handleTranslate" :loading="isLoading">翻译</t-button>
                  <t-button theme="danger" @click="handleAbort" :disabled="!isLoading">终止</t-button>
                  <t-button 
                    theme="primary" 
                    :disabled="!isTranslationCompleted"
                    @click="handleCompare"
                    class="compare-btn"
                  >
                    <template #icon><t-icon name="file-copy" /></template>
                    对比阅读
                  </t-button>
                </div>
              </t-form-item>
            </t-form>

            <!-- 进度条 -->
            <t-progress
              v-if="progressVisible"
              :percentage="progressPercentage"
              :status="progressStatus"
              style="margin-top: 16px;"
            />
          </t-col>

          <!-- 右侧：文件预览区域（占 2/3） -->
          <t-col :span="16" class="preview-col">
            <div class="preview-container">
              <iframe
                v-if="pdfUrl"
                :src="pdfUrl"
                class="preview-iframe"
              ></iframe>
              <div v-else class="empty-preview">
                <t-icon name="file-pdf" size="48px" />
                <p>请先上传 PDF 文件</p>
              </div>
            </div>
          </t-col>
        </t-row>

        <!-- 对比阅读弹窗 -->
        <div v-if="showComparison" class="comparison-modal">
          <div class="modal-header">
            <h3>对比阅读模式</h3>
            <t-icon name="close" class="close-icon" @click="closeComparison" />
          </div>
          
          <!-- 使用 PdfComparisonViewer 组件 -->
          <PdfComparisonViewer
            :source-file-path="comparisonSource"
            :target-file-path="comparisonTarget"
          />
        </div>

        <!-- 半透明遮罩层 -->
        <div 
          v-if="showComparison"
          class="modal-mask" 
          @click.self="closeComparison"
        ></div>
      </t-card>
    </t-content>
  </t-layout>
</template>

<script setup>
import { ref, reactive, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import PdfComparisonViewer from './PdfComparisonViewer.vue'; // 引入对比阅读组件
import IndexedDBUtil from '@/utils/IndexedDBUtil';

const dbUtil = new IndexedDBUtil('translationDB', 1);
// 工具类实现
const LocalStorageUtil = {
  setPendingTranslation(filePath) {
    localStorage.setItem('pendingTranslation', filePath);
  },
  getPendingTranslation() {
    return localStorage.getItem('pendingTranslation');
  },
  clearPendingTranslation() {
    localStorage.removeItem('pendingTranslation');
  },
  setFormData(formData) {
    localStorage.setItem('formData', JSON.stringify(formData));
  },
  getFormData() {
    const formData = localStorage.getItem('formData');
    return formData ? JSON.parse(formData) : null;
  },
};

// 响应式数据
const files = ref([]);
const autoUpload = ref(true);
const pdfUrl = ref('');
const translatedText = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const abortController = ref(null);
const isTranslationCompleted = ref(false);

// 进度条相关数据
const progressVisible = ref(false);
const progressPercentage = ref(0);
const progressStatus = ref('active');

// 对比阅读相关状态
const showComparison = ref(false);
const comparisonSource = ref('');
const comparisonTarget = ref('');

const form = reactive({
  sourceLanguage: 'en',
  targetLanguage: 'zh',
  platform: 'zhipu',
  model: 'GLM-4-Flash',
  apiKey: '',
});

const languages = [
  { value: 'zh', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: '英文' },
  { value: 'fr', label: '法语' },
  { value: 'de', label: '德语' },
  { value: 'ja', label: '日语' },
  { value: 'ko', label: '韩语' },
  { value: 'ru', label: '俄语' },
  { value: 'es', label: '西班牙语' },
  { value: 'it', label: '意大利语' },
];

const platforms = [
  { value: 'zhipu', label: '智谱AI' },
  { value: 'deepseek', label: 'DeepSeek' },
];

const models = ref([
  { value: 'GLM-4-Flash', label: 'GLM-4-Flash' },
  { value: 'GLM-4-Plus', label: 'GLM-4-Plus' },
]);

// 解析翻译结果
const parsedResult = computed(() => {
  try {
    return translatedText.value ? JSON.parse(translatedText.value) : null;
  } catch {
    return null;
  }
});

// 方法实现
const handlePlatformChange = (platform) => {
  if (platform === 'zhipu') {
    models.value = [
      { value: 'GLM-4-Flash', label: 'GLM-4-Flash' },
      { value: 'GLM-4-Plus', label: 'GLM-4-Plus' },
    ];
    form.model = 'GLM-4-Flash';
  } else if (platform === 'deepseek') {
    models.value = [
      { value: 'deepseek-chat', label: 'deepseek-chat' },
    ];
    form.model = 'deepseek-chat';
  }
};

const formatResponse = (response) => {
  return {
    code: response.code,
    data: response.data,
    msg: response.msg,
  };
};

const handleFileChange = (fileList, context) => {
  console.log('当前文件列表:', fileList);
  console.log('变更上下文:', context);

  progressVisible.value = false;
  progressPercentage.value = 0;
  progressStatus.value = 'active';

  const file = fileList[0];
  if (file?.raw) {
    const isPDF = [
      'application/pdf', 
      'application/x-pdf', 
      'application/acrobat'
    ].includes(file.raw.type) || 
    file.name.toLowerCase().endsWith('.pdf');

    if (!isPDF) {
      MessagePlugin.error('仅支持 PDF 文件格式');
      files.value = [];
      return;
    }

    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = URL.createObjectURL(file.raw);
  } else {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = '';
    }
  }
};

const handleSuccess = (params) => {
  const result = params.response;
  if (result.code === 200) {
    MessagePlugin.success('文件上传成功');
    LocalStorageUtil.setPendingTranslation(result.data);
  } else {
    MessagePlugin.error(result.msg || '文件上传失败');
  }
};

const handleRemove = () => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  pdfUrl.value = '';
  translatedText.value = '';
  errorMessage.value = '';
  LocalStorageUtil.clearPendingTranslation();
  MessagePlugin.success('文件已移除');
};

const handleError = () => {
  MessagePlugin.error('文件上传失败，请重试');
};

const handleTranslate = async () => {
  try {
    isLoading.value = true;
    isTranslationCompleted.value = false;
    errorMessage.value = '';
    translatedText.value = '';
    progressVisible.value = true;
    progressPercentage.value = 0;
    progressStatus.value = 'active';

    const filePath = LocalStorageUtil.getPendingTranslation();
    if (!filePath) {
      MessagePlugin.error('请先上传需要翻译的文件');
      return;
    }

    if (abortController.value) {
      abortController.value.abort();
      abortController.value = null;
    }

    abortController.value = new AbortController();

    await fetchEventSource('http://localhost:8089/pdf/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        file_path: filePath,
      }),
      retry: 0,
      heartbeatTimeout: 5000,
      fetch: (input, init) => {
        return window.fetch(input, {
          ...init,
          cache: 'no-store',
          keepalive: true
        })
      },
      signal: abortController.value.signal,
      openWhenHidden: true,
      onopen(response) {
        if (response.ok) {
          console.log('SSE 连接已建立');
        } else {
          throw new Error(`SSE 连接失败: ${response.status}`);
        }
      },
      onmessage(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'processing') {
            progressPercentage.value = data.progress;
          } else if (data.status === 'completed') {
            progressPercentage.value = 100;
            translatedText.value = data.result;
            // 提取文件名（去掉时间戳）
            const extractFileName = (filePath) => {
              // 兼容 Windows 和 Unix 路径分隔符
              const separator = filePath.includes('\\') ? '\\' : '/';
              const fileNameWithTimestamp = filePath.split(separator).pop(); // 获取文件名部分

              // 去掉文件后缀
              const fileNameWithoutExtension = fileNameWithTimestamp.split('.')[0];

              // 去掉时间戳（假设时间戳是14位数字）
              const fileNameWithoutTimestamp = fileNameWithoutExtension.replace(/\d{14}$/, '');

              return fileNameWithoutTimestamp;
            };
 
            // 存储翻译结果
            const translatedData = {
              fileName: extractFileName(data.result.source), // 提取原始文件名
              sourceFile: data.result.source,
              targetFile: data.result.target,
              translateTime: new Date().toISOString()
            };

            // 存储到 IndexedDB
            dbUtil.addTranslation(translatedData);
            console.log('翻译结果:', data.result);
            progressStatus.value = 'success';
            isTranslationCompleted.value = true;
            MessagePlugin.success('翻译完成');
          } else if (data.status === 'error') {
            errorMessage.value = data.message;
            progressStatus.value = 'error';
            MessagePlugin.error(`翻译失败: ${data.message}`);
          }
        } catch (err) {
          MessagePlugin.error('服务器返回数据格式错误');
        }
      },
      onerror(err) {
        errorMessage.value = err.message;
        progressStatus.value = 'error';
        MessagePlugin.error(`SSE 错误: ${err.message}`);
        throw err;
      },
      onclose() {
        console.log('SSE 连接已关闭');
        isLoading.value = false;
      },
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value = error.message;
      progressStatus.value = 'error';
      MessagePlugin.error(`翻译失败: ${error.message}`);
    }
  } finally {
    isLoading.value = false;
  }
};

// 打开对比阅读
const handleCompare = () => {
  if (!translatedText.value) {
    MessagePlugin.error('尚未生成可用的翻译结果');
    return;
  }
  
  comparisonSource.value = translatedText.value.source;
  comparisonTarget.value = translatedText.value.target;
  showComparison.value = true;
};

// 关闭对比阅读
const closeComparison = () => {
  showComparison.value = false;
  comparisonSource.value = '';
  comparisonTarget.value = '';
};

// 终止翻译时清理状态
const handleAbort = () => {
  if (abortController.value) {
    abortController.value.abort();
    abortController.value = null;
    isLoading.value = false;
    progressVisible.value = false;
    translatedText.value = '';
    errorMessage.value = '';
    MessagePlugin.info('翻译已终止');
  }
};

// 组件挂载时初始化
onMounted(() => {
  const savedData = LocalStorageUtil.getFormData();
  if (savedData) {
    const platformModels = {
      zhipu: ['GLM-4-Flash', 'GLM-4-Plus'],
      deepseek: ['deepseek-chat']
    };
    if (!platformModels[savedData.platform]?.includes(savedData.model)) {
      savedData.model = platformModels[savedData.platform]?.[0] || 'GLM-4-Flash';
    }
    Object.assign(form, savedData);
  }
  LocalStorageUtil.clearPendingTranslation();
});

// 监听表单变化并保存到本地存储
watch(form, (newValue) => {
  LocalStorageUtil.setFormData(newValue);
}, { deep: true });

// 组件卸载时释放资源
onBeforeUnmount(() => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  if (abortController.value) {
    abortController.value.abort();
  }
});
</script>

<style scoped>
.empty-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary);
}

.preview-col {
  padding-left: 24px;
  height: 650px;
  width: calc(100% * 16/24 - 24px);
}

.preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  background: var(--td-bg-color-secondarycontainer);
  border-radius: var(--td-radius-default);
  overflow: hidden;
}

.preview-iframe {
  width: 80%;
  height: 100%;
  border: none;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.compare-btn {
  flex: 1;
  min-width: 120px;
  transition: all 0.3s ease;
}

.compare-btn:not([disabled]) {
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.compare-btn:hover:not([disabled]) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

/* 对比阅读弹窗样式 */
.comparison-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  height: 85vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-icon {
  cursor: pointer;
  padding: 8px;
  transition: all 0.3s;
}

.close-icon:hover {
  color: var(--td-error-color);
  transform: rotate(90deg);
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 调整对比组件容器高度 */
.pdf-comparison-container {
  height: calc(85vh - 57px); /* 减去头部高度 */
}
</style>