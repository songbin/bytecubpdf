<template>
  <div class="terms-manager">
    <n-space vertical :size="12">
      <n-space justify="start" align="center">
        <n-button size="small" @click="addRow">手动新增</n-button>
        <n-button size="small" @click="saveChanges"  >手动保存</n-button>
        <n-button size="small" @click="handleExportExcel" :loading="exporting">导出术语</n-button>
        <n-button size="small" @click="handleDownloadTemplate">下载模板</n-button>
        <n-upload
          :show-file-list="false"
          accept=".xlsx"
          :custom-request="() => {}"
          @change="handleImportExcel"
        >
          <n-button size="small" :loading="importing">导入</n-button>
        </n-upload>
      </n-space>

      <n-card :bordered="false" class="table-card">
        <n-data-table 
          :columns="columns" 
          :data="data" 
          :row-key="row => row.id || Math.random().toString(36).substring(2)"
          :max-height="500"
          virtual-scroll/>
      </n-card>

      <n-space justify="end" class="pagination-wrapper">
        <n-pagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-count="totalPages"
          show-size-picker
          :page-sizes="pagination.pageSizes"
          @update:page="pagination.onChange"
          @update:page-size="pagination.onUpdatePageSize"
        />
      </n-space>
    </n-space>
    <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/terms.html" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'TermsManager'
})

import type { DataTableColumns, UploadFileInfo } from 'naive-ui'
import { NInput, NButton, NSpace, NDataTable, NPagination, NUpload,NFlex } from 'naive-ui'
import { h, ref, onMounted } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { translateTermManager } from '@/renderer/service/manager/TranslateTermManager';
import { termsExcelService, ExcelTermRow, ConflictResolutionStrategy } from '@/renderer/service/excel/TermsExcelService';
import type { Term } from '@/renderer/model/terms/terms';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue'
const dialog = useDialog();
const message = useMessage();

const importing = ref(false);
const exporting = ref(false);
 

interface TermItem {
  id?: number; // 改为可选属性
  sourceTerm: string
  translatedTerm: string
}

const data = ref<TermItem[]>([
  {
    id: 1, // 改为id
    sourceTerm: 'demo term',
    translatedTerm: '示例术语'
  }
])

const addRow = () => {
  data.value.unshift({  // 使用unshift代替push
    id: undefined,
    sourceTerm: '',
    translatedTerm: ''
  });
}

// 修改所有引用key的地方为id
const saveChanges = async () => {
  try {
    // 验证必填字段
    for (const item of data.value) {
      if (!item.sourceTerm || !item.translatedTerm) {
        message.warning('源术语和翻译内容不能为空');
        return;
      }
    }
    for (const item of data.value) {
      if (item.id) {
        await translateTermManager.update(item.id, {
          sourceTerm: item.sourceTerm,
          translatedTerm: item.translatedTerm
        });
      } else {
        const createdItem = await translateTermManager.create({
          sourceTerm: item.sourceTerm,
          translatedTerm: item.translatedTerm
        });
         
      }
    }
    message.success('保存成功');
    await loadData();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  }
};

const deleteHandler = async (row: TermItem, index: number) => {
  dialog.warning({
    title: '删除确认',
    content: '确定要删除该术语吗？',
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        if (row.id) {
          await translateTermManager.delete(row.id);
        }
        data.value.splice(index, 1);
        message.success('删除成功');
        await loadData();
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败');
      }
    }
  })
}
const createColumns = (): DataTableColumns<TermItem> => [
  {
    title: '源术语',
    key: 'sourceTerm',
    render(row, index) {
      return h(NInput, {
        value: row.sourceTerm,
        onUpdateValue(v) {
          data.value[index].sourceTerm = v
        }
      })
    }
  },
  {
    title: '翻译后',
    key: 'translatedTerm',
    render(row, index) {
      return h(NInput, {
        value: row.translatedTerm,
        onUpdateValue(v) {
          data.value[index].translatedTerm = v
        }
      })
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row, index) {
      return h(NButton, {
        type: 'error',
        onClick: () => deleteHandler(row, index)
      }, () => '删除')
    }
  }
]
const columns = createColumns()
const totalPages = ref(0);
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.value.page = page;
    loadData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize;
    pagination.value.page = 1;
    loadData();
  }
});

const loadData = async () => {
  const result = await translateTermManager.paging({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  data.value = result.items.map(item => ({
    id: item.id,
    sourceTerm: item.sourceTerm,
    translatedTerm: item.translatedTerm
  }));
  pagination.value.itemCount = result.total;
  totalPages.value = Math.ceil(pagination.value.itemCount / pagination.value.pageSize)

  console.log('分页数据加载:', {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      total: pagination.value.itemCount,
      dataLength: data.value.length,
      totalPages: totalPages.value
    });
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  loadData();
};

const handleDownloadTemplate = async () => {
  try {
    const blob = await termsExcelService.generateTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '术语导入模板.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('模板下载成功');
  } catch (error) {
    console.error('下载模板失败:', error);
    message.error('下载模板失败');
  }
};

const handleExportExcel = async () => {
  try {
    exporting.value = true;
    
    const result = await translateTermManager.paging({
      page: 1,
      pageSize: 10000
    });
    
    if (result.items.length === 0) {
      message.warning('没有数据可导出');
      return;
    }
    
    const blob = await termsExcelService.exportTerms(result.items);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `术语导出_${timestamp}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success(`成功导出${result.items.length}条术语`);
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败');
  } finally {
    exporting.value = false;
  }
};

const handleImportExcel = async (options: { fileList: UploadFileInfo[] }) => {
  const file = options.fileList[0];
  if (!file) return;
  
  try {
    importing.value = true;
    
    const excelData = await termsExcelService.parseExcel(file.file as File);
    
    const validationResult = termsExcelService.validateExcelData(excelData);
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => 
        `第${e.row}行 ${e.field}: ${e.message}`
      ).join('\n');
      message.error(`数据验证失败:\n${errorMessages}`);
      return;
    }
    
    if (validationResult.duplicateInFileRows.length > 0) {
      const duplicateMessages = validationResult.warnings
        .filter(w => validationResult.duplicateInFileRows.includes(w.row))
        .map(w => w.message)
        .join('\n');
      message.error(`文件中存在重复项:\n${duplicateMessages}`);
      return;
    }
    
    const sourceTerms = validationResult.validRows.map(row => row.源术语);
    const conflicts = await translateTermManager.batchExistsBySourceTerms(sourceTerms);
    
    if (conflicts.length > 0) {
      const conflictList = conflicts.slice(0, 10).join('、');
      const showMore = conflicts.length > 10 ? `等${conflicts.length}个术语` : '';
      
      dialog.warning({
        title: '发现重复术语',
        content: `以下术语已存在于数据库中：\n${conflictList}${showMore}\n\n请选择处理方式：`,
        positiveText: '覆盖全部',
        negativeText: '跳过重复',
        onPositiveClick: async () => {
          await executeImport(validationResult.validRows, ConflictResolutionStrategy.OVERWRITE_ALL, conflicts);
        },
        onNegativeClick: async () => {
          await executeImport(validationResult.validRows, ConflictResolutionStrategy.SKIP_DUPLICATE, conflicts);
        }
      });
      return;
    }
    
    await executeImport(validationResult.validRows, ConflictResolutionStrategy.SKIP_DUPLICATE, []);
    
  } catch (error) {
    console.error('导入失败:', error);
    message.error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    importing.value = false;
  }
};

const executeImport = async (
  validRows: ExcelTermRow[],
  strategy: ConflictResolutionStrategy,
  conflicts: string[]
) => {
  try {
    importing.value = true;
    
    const termsToInsert: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    let skippedCount = 0;
    
    for (const row of validRows) {
      if (conflicts.includes(row.源术语)) {
        if (strategy === ConflictResolutionStrategy.OVERWRITE_ALL) {
          await translateTermManager.updateBySourceTerm(row.源术语, {
            translatedTerm: row.翻译后
          });
        } else if (strategy === ConflictResolutionStrategy.SKIP_DUPLICATE) {
          skippedCount++;
        }
      } else {
        termsToInsert.push({
          sourceTerm: row.源术语,
          translatedTerm: row.翻译后
        });
      }
    }
    
    if (termsToInsert.length > 0) {
      await translateTermManager.batchCreate(termsToInsert);
    }
    
    const successCount = termsToInsert.length + (strategy === ConflictResolutionStrategy.OVERWRITE_ALL ? conflicts.length : 0);
    
    message.success(`导入完成：成功${successCount}条，跳过${skippedCount}条`);
    
    await loadData();
    
  } catch (error) {
    console.error('导入失败:', error);
    message.error('导入失败，数据已回滚');
    throw error;
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.terms-manager {
  padding: 16px;
}

.pagination-wrapper {
  margin-top: 8px;
  padding: 8px 0;
}

.table-card {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 表格滚动条样式 */
.n-data-table {
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
}

.n-data-table::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.n-data-table::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 3px;
}

.n-data-table::-webkit-scrollbar-track {
  background-color: transparent;
}
</style>
 
