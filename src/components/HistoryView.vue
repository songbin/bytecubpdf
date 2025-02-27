<template>
  <div class="main-container">
    <!-- 表格内容 -->
    <t-table
      v-if="!showComparison && !showOriginal && !showTranslation"
      row-key="id"
      :data="translations"
      :columns="columns"
      :table-layout="tableLayout"
      :fixed-rows="fixedTopAndBottomRows ? [2, 2] : undefined"
      bordered
      lazy-load
    >
      <template #operation="{ row }">
        <div class="action-buttons">
          <t-button theme="primary" size="small" @click="handleCompare(row)">
            对比阅读
          </t-button>
          <t-button theme="default" size="small" @click="handleOriginal(row)">
            原文阅读
          </t-button>
          <t-button theme="default" size="small" @click="handleTranslation(row)">
            翻译阅读
          </t-button>
        </div>
      </template>
    </t-table>

    <!-- 对比阅读全屏模式 -->
    <div v-if="showComparison" class="comparison-modal">
      <div class="modal-header">
        <h3 class="modal-title">对比阅读模式</h3>
        <t-icon name="close" class="close-icon" @click="closeComparison" />
      </div>
      <PdfComparisonViewer
        :source-file-path="comparisonSource"
        :target-file-path="comparisonTarget"
      />
    </div>

    <!-- 原文阅读模式 -->
    <PdfViewer
      v-if="showOriginal"
      :file-path="comparisonSource"
      @close="closeOriginal"
    />

    <!-- 翻译阅读模式 -->
    <PdfViewer
      v-if="showTranslation"
      :file-path="comparisonTarget"
      @close="closeTranslation"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import IndexedDBUtil from '@/utils/IndexedDBUtil';
import PdfComparisonViewer from '@/components/PdfComparisonViewer.vue'; // 引入对比阅读组件
import PdfViewer from '@/components/PdfViewer.vue'; // 引入单个 PDF 查看组件

const dbUtil = new IndexedDBUtil('translationDB', 1);

const translations = ref([]);
const tableLayout = ref('fixed');
const fixedTopAndBottomRows = ref(false);

const columns = ref([
  {
    colKey: 'fileName',
    title: '文件名',
    width: 150,
    foot: '-',
  },
  {
    colKey: 'translateTime',
    title: '翻译时间',
    width: 150,
    foot: '-',
    cell: (h, { row }) => {
      return formatDate(row.translateTime);
    },
  },
  {
    colKey: 'operation',
    title: '操作',
    width: 200,
    foot: '-',
  },
]);

// 对比阅读状态
const showComparison = ref(false);
const comparisonSource = ref(''); // 源文件路径
const comparisonTarget = ref(''); // 目标文件路径

// 原文阅读状态
const showOriginal = ref(false);
const originalSource = ref(''); // 原文文件路径

// 翻译阅读状态
const showTranslation = ref(false);
 

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '无有效日期';
  return date.toLocaleString();
};

// 加载翻译记录
const loadTranslations = async () => {
  try {
    const allTranslations = await dbUtil.getTranslations(1, 1000);
    translations.value = allTranslations;
  } catch (error) {
    console.error('加载翻译记录失败:', error);
  }
};

// 对比阅读
const handleCompare = (row) => {
  comparisonSource.value = row.sourceFile;
  comparisonTarget.value = row.targetFile;
  showComparison.value = true;
};

// 原文阅读
const handleOriginal = (row) => {
  originalSource.value = row.sourceFile;
  comparisonSource.value = row.sourceFile;
  showOriginal.value = true;
};

// 翻译阅读
const handleTranslation = (row) => { 
  comparisonTarget.value = row.targetFile;
  showTranslation.value = true;
};

// 关闭对比阅读
const closeComparison = () => {
  showComparison.value = false;
};

// 关闭原文阅读
const closeOriginal = () => {
  showOriginal.value = false;
};

// 关闭翻译阅读
const closeTranslation = () => {
  showTranslation.value = false;
};

// 加载数据
loadTranslations();
</script>

<style scoped>
.main-container {
  position: relative;
  height: 100vh;
}

.action-buttons {
  display: flex;
  /* justify-content: space-between; */
  gap: 4px;
}

.comparison-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
}

.close-icon {
  cursor: pointer;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}
</style>