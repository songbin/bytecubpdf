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
        <div style="display: flex; justify-content: space-between; width: 100%; position: fixed; top: 0; left: 0; right: 0; background: white; z-index: 1000; padding: 10px 16px; border-bottom: 1px solid #eee;">
          <span>PDF预览</span>
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
              @click="handleClosePdfViewer"
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

    <!-- PDF 对比预览弹窗 -->
    <n-modal
      v-model:show="showCompareViewer"
      preset="card"
      :mask-closable="false"
      style="width: 100vw;z-index: 1000; height: 100vh; max-width: 100%;"
      :bordered="false"
      :closable="false"
      content-style="padding: 0;"
       
    >
      
      <PdfCompareViewer
        :file-path-left="currentPdfLeft"
        :file-path-right="currentPdfRight"
        style="width: 100%; height: 100%;"
        @close="handleCloseCompareViewer"
      />
    </n-modal>
    <n-flex justify="end" style="margin-bottom: 12px" :size="8">
  <n-button 
    size="small" 
    tertiary 
    type="info"
    @click="handleOpenSourceDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    源文件目录
  </n-button>
  <n-button 
    size="small" 
    tertiary 
    type="success"
    @click="handleOpenTranslateDir"
  >
    <template #icon>
      <n-icon><Folder/></n-icon>
    </template>
    翻译目录
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
    <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/translatehistroy.html" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { Folder } from '@vicons/carbon';
import { NDataTable, NFlex, NPagination, NSpace, NButton, NTooltip, NModal, NIcon, NButtonGroup, useMessage } from 'naive-ui';
import { h } from 'vue';
import { TranslateHistory } from '@/renderer/model/translate/TranslateHistory';
import { TranslateHistoryManager } from '@/renderer/service/manager/TranslateHistoryManager';
import PdfViewer from './PdfViewer.vue';
import PdfCompareViewer from './PdfCompareViewer.vue';
import { Maximize, Close } from '@vicons/carbon';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'
const historyManager = new TranslateHistoryManager();
defineOptions({
  name: 'TranslateHistory'
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
  { 
    title: '引擎', 
    key: 'translationEngine', 
    width: 100,
    render: (row: TranslateHistory) => row.translationEngine === 'babeldoc' ? 'BabelDOC' : row.translationEngine === 'pdfmath' ? 'PDFMath 1.x' : row.translationEngine
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
            onClick: () => handleViewSource(row.sourceFile),
          },
          () => '看源'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleViewTarget(row.targetFile),
          },
          () => '看译'
        ),
        row.ext2 ? h(
          NButton,
          {
            size: 'small',
            type: 'success',
            text: true,
            onClick: () => handleViewTarget(row.ext2!),
          },
          () => '原生对照'
        ) : null,
        h(
          NButton,
          {
            size: 'small',
            type: 'warning',
            text: true,
            onClick: () => handleCompare(row.sourceFile, row.targetFile),
          },
          () => '对比'
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'warning',
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
      historyManager.getPage(pagination.page, pagination.pageSize),
      historyManager.getTotalCount(),
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
const currentPdfPath = ref('');

const handleViewSource = async (path: string) => {
  try {
    const uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    if (!uploadDir) throw new Error('无法获取上传目录路径');
    const fullPath = await (window as any).window.electronAPI?.pathJoin(uploadDir, path);
    // const fullPath = `${uploadDir}\\${path}`;
    currentPdfPath.value = fullPath;
    showPdfViewer.value = true;
  } catch (error) {
    message.error(`打开源文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleViewTarget = async (path: string) => {
  try {
    const uploadDir = await window.electronAPI?.getTranslateDirPath();
    if (!uploadDir) throw new Error('无法获取上传目录路径');
    const fullPath = await window.electronAPI?.pathJoin(uploadDir, path);
    currentPdfPath.value = fullPath;
    showPdfViewer.value = true;
  } catch (error) {
    message.error(`打开目标文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleClosePdfViewer = () => {
  showPdfViewer.value = false;
  currentPdfPath.value = '';
};

// PDF 对比相关逻辑
const showCompareViewer = ref(false);
const currentPdfLeft = ref('');
const currentPdfRight = ref('');
const handleDelete = async (id: number|undefined) => {
  if (!id) {
    message.error('记录不存在');
    return;
  }
  try {
    const history = await historyManager.queryHistory(id);
    if (!history) throw new Error('记录不存在');
    
    const sourceFile = history.sourceFile;
    const targetFile = history.targetFile;
    const nativeFile = history.ext2;//双语pdf
    const [uploadDir, translateDir] = await Promise.all([
      (window as any).window.electronAPI?.getUploadDirPath(),
      (window as any).window.electronAPI?.getTranslateDirPath(),
    ]);
    if (!uploadDir || !translateDir) throw new Error('路径获取失败');
    //三个文件，只要不为空 就删除文件
    if (sourceFile) {
      const sourcePath = await window.electronAPI?.pathJoin(uploadDir, sourceFile);
      await window.electronAPI?.deleteFile(sourcePath);
    }
    if (targetFile) {
      const targetPath = await window.electronAPI?.pathJoin(translateDir, targetFile);
      await window.electronAPI?.deleteFile(targetPath);
    }
    if (nativeFile) {
      const nativePath = await window.electronAPI?.pathJoin(translateDir, nativeFile);
      await window.electronAPI?.deleteFile(nativePath);
    }
    await historyManager.deleteHistory(id);
    loadData();
  } catch (error) {
    message.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};
const handleCompare = async (source: string, target: string) => {
  try {
    const [uploadDir, translateDir] = await Promise.all([
      (window as any).window.electronAPI?.getUploadDirPath(),
      (window as any).window.electronAPI?.getTranslateDirPath(),
    ]);
    if (!uploadDir || !translateDir) throw new Error('路径获取失败');
    // currentPdfLeft.value = `${uploadDir}\\${source}`;
    // currentPdfRight.value = `${translateDir}\\${target}`;
    currentPdfLeft.value = await window.electronAPI?.pathJoin(uploadDir, source);
    currentPdfRight.value = await window.electronAPI?.pathJoin(translateDir, target);
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

// 最大化窗口
const maximizeWindow = async () => {
  try {
    console.log('最大化窗口');
    await (window as any).window.electronAPI?.maximizeWindow();
  } catch (error) {
    console.error('最大化窗口失败:', error);
  }
};

const handleOpenSourceDir = async () => {
  try {
    const uploadDir = await (window as any).window.electronAPI?.getUploadDirPath();
    await (window as any).window.electronAPI?.openPath(uploadDir);
  } catch (error) {
    message.error(`打开源目录失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const handleOpenTranslateDir = async () => {
  try {
    const translateDir = await (window as any).window.electronAPI?.getTranslateDirPath();
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