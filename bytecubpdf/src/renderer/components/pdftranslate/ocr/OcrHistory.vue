<template>
  <div class="history-container">
    <!-- PDF 预览弹窗 -->
    <n-modal
      v-model:show="showPdfViewer"
      preset="card"
      :mask-closable="false"
      style="width: 100vw; height: 100vh; max-width: 100%;"
      :bordered="false"
      :closable="false"
      content-style="padding: 0;"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <span>文档预览</span>
          <n-button-group>
            <n-button
              tertiary
              circle
              @click="maximizeWindow"
              aria-label="最大化窗口"
              class="control-btn custom-btn"
            >
              <template #icon>
                <n-icon style="font-size: 12px"><Maximize /></n-icon>
              </template>
            </n-button>
            <n-button
              circle
              type="error"
              @click="handleSourceCloseViewer"
              aria-label="关闭窗口"
              class="control-btn close-btn"
            >
              <template #icon>
                <n-icon style="font-size: 14px"><Close /></n-icon>
              </template>
            </n-button>
          </n-button-group>
        </div>
      </template>
      <PdfViewer
        :file-path="currentPdfPath"
        style="width: 100%; height: 100%;"
      />

     
    </n-modal>

    <n-modal
      v-model:show="showMdViewer"
      preset="card"
      :mask-closable="false"
      style="width: 100vw; height: 100vh; max-width: 100%;"
      :bordered="false"
      :closable="false"
      content-style="padding: 0;"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <span>文档预览</span>
          <n-button-group>
            <n-button
              tertiary
              circle
              @click="maximizeWindow"
              aria-label="最大化窗口"
              class="control-btn custom-btn"
            >
              <template #icon>
                <n-icon style="font-size: 12px"><Maximize /></n-icon>
              </template>
            </n-button>
            <n-button
              circle
              type="error"
              @click="handleCloseMarkdownfViewer"
              aria-label="关闭窗口"
              class="control-btn close-btn"
            >
              <template #icon>
                <n-icon style="font-size: 14px"><Close /></n-icon>
              </template>
            </n-button>
          </n-button-group>
        </div>
      </template>
    
       <MarkdownViewer
        :source="markdownSource"
        title="文档预览"
      />
      
    </n-modal>

    <!-- PDF 对比预览弹窗 -->
    <!-- PDF 对比预览弹窗 -->
    <n-modal
      v-model:show="showCompareViewer"
      preset="card"
      :mask-closable="false"
      style="width: 100vw; height: 100vh; max-width: 100%;"
      :bordered="false"
      :closable="false"
      content-style="padding: 0;"
    >
      <template #header>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <span>对比预览</span>
          <n-button-group>
            <n-button
              tertiary
              circle
              @click="maximizeWindow"
              aria-label="最大化窗口"
              class="control-btn custom-btn"
            >
              <template #icon>
                <n-icon style="font-size: 12px"><Maximize /></n-icon>
              </template>
            </n-button>
            <n-button
              circle
              type="error"
              @click="handleCloseCompareViewer"
              aria-label="关闭窗口"
              class="control-btn close-btn"
            >
              <template #icon>
                <n-icon style="font-size: 14px"><Close /></n-icon>
              </template>
            </n-button>
          </n-button-group>
        </div>
      </template>
      <PdfCompareViewer
        :file-path-left="currentPdfLeft"
        :file-path-right="currentPdfRight"
        style="width: 100%; height: 100%;"
      />
    </n-modal>
    <n-flex justify="end" style="margin-bottom: 12px" :size="8">
  <n-button 
    size="small" 
    tertiary 
    type="info"
    @click="handleOpenPDFSourceDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    原始PDF目录
  </n-button>

  <n-button 
    size="small" 
    tertiary 
    type="info"
    @click="handleOpenImageSourceDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    原始图片目录
  </n-button>
  <n-button 
    size="small" 
    tertiary 
    type="success"
    @click="handleOpenWordDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    word文件目录
  </n-button>
  <n-button 
    size="small" 
    tertiary 
    type="success"
    @click="handleOpenMarkdownWordDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    MD文件目录
  </n-button>
</n-flex>
    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="data"
      :loading="isLoading"
      :max-height="400"
      :scroll-x="950"
      virtual-scroll
      remote
    />

    <!-- 分页器 -->
    <n-space justify="end" class="pagination-wrapper">
      <n-pagination
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-count="totalPages"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-space>
    <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/ocrhistory.html" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { Folder } from '@vicons/carbon';
import { NDataTable, NFlex, NPagination, useDialog, NSpace, NButton, NTooltip, NModal, NIcon, NButtonGroup, useMessage } from 'naive-ui';
import { h } from 'vue';
import { TranslateHistory } from '@/renderer/model/translate/TranslateHistory';
import { TranslateHistoryManager } from '@/renderer/service/manager/TranslateHistoryManager';
import PdfViewer from '../PdfViewer.vue';
import PdfCompareViewer from '../PdfCompareViewer.vue';
import { Maximize, Close } from '@vicons/carbon';
import MarkdownViewer from '@/renderer/components/pdftranslate/ocr/MarkdownView.vue'
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'

const historyManager = new TranslateHistoryManager();
const dialog = useDialog()
defineOptions({
  name: 'OcrHistory'

})
// 表格列定义
// 在导入部分添加 TableColumn 类型
import { TableColumn } from 'naive-ui/es/data-table/src/interface';

// 修改 columns 定义
const columns: TableColumn<TranslateHistory>[] = [
  {
    title: '文件',
    key: 'sourceFile',
    ellipsis: true,
    width: 120,
    render: (row: TranslateHistory) =>
      h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.sourceFile,
          trigger: () => h('span', { style: 'width: 100%' }, row.sourceFile),
        }
      ),
  },
  {
  title: '类型',
    key: 'ext2',
    ellipsis: true,
    width: 120,
    render: (row: TranslateHistory) =>
      h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.sourceFile,
          trigger: () => h('span', { style: 'width: 100%' }, row.ext2),
        }
      ),
  },
  {
    title: '平台',
    key: 'platformName',
    ellipsis: true,
    width: 80,
    render: (row: TranslateHistory) =>
      h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.platformName,
          trigger: () => h('span', { style: 'width: 100%' }, row.platformName),
        }
      ),
  },
  {
    title: '模型',
    key: 'modelName',
    ellipsis: true,
    width: 120,
    render: (row: TranslateHistory) =>
      h(
        NTooltip,
        { trigger: 'hover' },
        {
          default: () => row.modelName,
          trigger: () => h('span', { style: 'width: 100%' }, row.modelName),
        }
      ),
  },
  
  { title: '页数', key: 'totalPages', width: 80 },
  { title: '耗时(秒)', key: 'timeConsumed', width: 80 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render(row: TranslateHistory) {
      return h(NSpace, { justify: 'start', size: 'small' }, () => [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            text: true,
            onClick: () => handleViewSource(row.sourceFile, row.ext2),
          },
          () => '看源'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleViewMarkdownTarget(row.ext4),
          },
          () => '看MD'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleCompare(row.sourceFile, row.ext4, row.ext2),
          },
          () => '对比'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleViewWordTarget(row.ext3),
          },
          () => '导出word'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleDelete(row.id),
          },
          () => '删除'
        ),
      ]);
    },
  },
];

// 响应式数据
const data = ref<TranslateHistory[]>([]);
const isLoading = ref(false);
const total = ref(0);

// 分页相关响应式对象
const pagination = reactive({
  page: 1,
  pageSize: 10,
  pageCount: 0,
});

// 计算总页数
const totalPages = ref(0);

// 加载数据
const loadData = async () => {
  try {
    isLoading.value = true;
    const [historyData, totalCount] = await Promise.all([
      historyManager.getPage(pagination.page, pagination.pageSize, 'ocr'),
      historyManager.getTotalCount('ocr'),
    ]);
    data.value = historyData;
    total.value = totalCount;
    totalPages.value = Math.ceil(totalCount / pagination.pageSize);
  } catch (error) {
    console.error('加载历史记录失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 分页变化处理
const handlePageChange = (newPage: number) => {
  pagination.page = newPage;
  loadData();
};

// 分页大小变化处理
const handlePageSizeChange = (newSize: number) => {
  pagination.pageSize = newSize;
  pagination.page = 1; // 重置到第一页
  loadData();
};

onMounted(() => {
  loadData();
});

// PDF 预览相关逻辑
const message = useMessage();
const showPdfViewer = ref(false);
const showMdViewer = ref(false);
const showCompareViewer = ref(false);
const currentPdfLeft = ref('');
const currentPdfRight = ref('');
const currentPdfPath = ref('');
const markdownSource = ref(''); // 用于存储 Markdown 内容
const handleCompare = async (source: string | undefined, target: string | undefined, file_type:string| undefined) => {
  try {
    
    let uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    if(file_type == 'pdf'){
      uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    }else if (file_type == 'image'){
      uploadDir = await (window as any).window.electronAPI?.getUploadOcrImagePath();
    }
    const fullSourcePath = await (window as any).window.electronAPI?.pathJoin(uploadDir, source);
    
    const resultDir = await (window as any).window.electronAPI?.getUploadOcrResultMdPath();
    if (!resultDir) throw new Error('无法获取markdown目录路径');
    const fullTargetPath = await (window as any).window.electronAPI?.pathJoin(resultDir, target);

    if (!uploadDir || !resultDir) throw new Error('路径获取失败');
    currentPdfLeft.value = fullSourcePath;
    currentPdfRight.value = fullTargetPath;
    showCompareViewer.value = true;
  } catch (error) {
    message.error(`打开对比失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleCloseCompareViewer = () => {
  showCompareViewer.value = false;
  currentPdfLeft.value = '';
  currentPdfRight.value = '';
};
const handleViewSource = async (path: string| undefined, file_type:string| undefined) => {
  try {
   
    let uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    if(file_type == 'pdf'){
      uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    }else if (file_type == 'image'){
      uploadDir = await (window as any).window.electronAPI?.getUploadOcrImagePath();
    }
    
    if (!uploadDir) throw new Error('无法获取上传目录路径');
    const fullPath = await (window as any).window.electronAPI?.pathJoin(uploadDir, path);
    // const fullPath = `${uploadDir}\\${path}`;
    currentPdfPath.value = fullPath;
    
    showPdfViewer.value = true;
    
  } catch (error) {
    message.error(`打开源文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};
const handleSourceCloseViewer = () => {
    showPdfViewer.value = false;
    currentPdfPath.value = '';
};
const handleDelete = async (id: number|undefined) => {
  dialog.warning({
      title: '确认删除',
      content: '确认删除记录以及对应文件？',
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        await fileDelete(id);
      }
    })
}
const fileDelete = async (id: number|undefined) => {
  if (!id) return;
  try {
    const history = await historyManager.queryHistory(id);
    if (!history) throw new Error('记录不存在');
    const fileType = history.ext2;
    const sourceFile = history.sourceFile;
    const docxFile = history.ext3;//DOCX
    const mdFile = history.ext4;//md文件
    const [pdfDir, wordDir, mdDir, imageDir] = await Promise.all([
      window.electronAPI?.getUploadDirPath(),
      window.electronAPI?.getUploadOcrResultDocxPath(),
      window.electronAPI?.getUploadOcrResultMdPath(),
      window.electronAPI?.getUploadOcrImagePath(),
    ]);
    if (!pdfDir || !wordDir || !mdDir || !imageDir) throw new Error('路径获取失败');
    //三个文件，只要不为空 就删除文件
    if (sourceFile) {
      let uploadDir = pdfDir;
      if(fileType == 'image'){
        uploadDir = imageDir;
      }else if(fileType == 'pdf'){
        uploadDir = pdfDir;
      }
      const sourcePath = await window.electronAPI?.pathJoin(uploadDir, sourceFile);
      await window.electronAPI?.deleteFile(sourcePath);
    }
    if (docxFile) {
      const targetPath = await window.electronAPI?.pathJoin(wordDir, docxFile);
      await window.electronAPI?.deleteFile(targetPath);
    }
    if (mdFile) {
      const nativePath = await window.electronAPI?.pathJoin(mdDir, mdFile);
      await window.electronAPI?.deleteFile(nativePath);
    }
    await historyManager.deleteHistory(id);
    loadData();
  } catch (error) {
    message.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
  }
   
}
const handleViewWordTarget = async (path: string| undefined) => {
  try {
    const uploadDir = await window.electronAPI?.getUploadOcrResultDocxPath();
    if (!uploadDir) throw new Error('无法获取word文档目录路径');
    const fullPath = await (window as any).window.electronAPI?.pathJoin(uploadDir, path);
    currentPdfPath.value = fullPath;
    showPdfViewer.value = true;
  } catch (error) {
    message.error(`打开目标文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleViewMarkdownTarget = async (path: string| undefined) => {
  try {
    const uploadDir = await (window as any).window.electronAPI?.getUploadOcrResultMdPath();
    if (!uploadDir) throw new Error('无法获取markdown目录路径');
    const fullPath = await (window as any).window.electronAPI?.pathJoin(uploadDir, path);
    markdownSource.value = fullPath;
     
    showMdViewer.value = true;
  } catch (error) {
    message.error(`打开目标文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleCloseMarkdownfViewer = () => {
  showMdViewer.value = false;
  markdownSource.value = '';
};
 
// 最大化窗口
const maximizeWindow = async () => {
  try {
    await (window as any).window.electronAPI?.maximizeWindow();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
};

const handleOpenImageSourceDir = async () => {
  try {
    const uploadDir = await (window as any).window.electronAPI?.getUploadOcrImagePath();
    await (window as any).window.electronAPI?.openPath(uploadDir);
  } catch (error) {
    message.error(`打开源目录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleOpenPDFSourceDir = async () => {
  try {
    const uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    await (window as any).window.electronAPI?.openPath(uploadDir);
  } catch (error) {
    message.error(`打开源目录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleOpenWordDir = async () => {
  try {
    const translateDir = await (window as any).window.electronAPI?.getUploadOcrResultDocxPath();
    await (window as any).window.electronAPI?.openPath(translateDir);
  } catch (error) {
    message.error(`打开翻译目录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleOpenMarkdownWordDir = async () => {
  try {
    const translateDir = await (window as any).window.electronAPI?.getUploadOcrResultMdPath();
    await (window as any).window.electronAPI?.openPath(translateDir);
  } catch (error) {
    message.error(`打开翻译目录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};
</script>

<style scoped>
.history-container {
  padding: 2px;
  width: 100%;
  box-sizing: border-box;
}
:deep(.n-data-table) {
  min-width: 100% !important;
}
.pagination-wrapper {
  margin-top: 20px;
  padding: 10px 0;
}
.n-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
/* 新增按钮样式 */
:deep(.custom-btn) {
  width: 22px !important;
  height: 22px !important;
  background-color: #34495e !important;
  color: white !important;
  transition: background-color 0.2s ease !important;
}
:deep(.custom-btn:hover) {
  background-color: #2c3e50 !important;
}
:deep(.close-btn) {
  width: 22px !important;
  height: 22px !important;
  color: white !important;
  transition: background-color 0.2s ease !important;
  background-color: #e74c3c !important;
}
:deep(.close-btn:hover) {
  background-color: #c0392b !important;
}
/* 调整按钮内容布局 */
:deep(.n-button__content) {
  display: flex !important;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}
</style>