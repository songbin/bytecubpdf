<template>
  <div>
    <n-space vertical>
      <n-data-table 
      :columns="columns" 
      :data="data" 
      :row-key="row => row.id || Math.random().toString(36).substring(2)"
      :max-height="400"
      
      virtual-scroll/>
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
      <n-space justify="start" :wrap-item="false">
        <n-button @click="addRow">新增</n-button>
        <n-button @click="saveChanges" type="primary">保存</n-button>
      </n-space>
    </n-space>
    <HelpFloatButton url="https://www.docfable.com/docs/usage/translatementor/terms.html" />
  </div>
</template>

<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import { NInput, NButton, NSpace, NDataTable,NPagination } from 'naive-ui'
import { h, ref,onMounted } from 'vue'
import { useDialog,useMessage } from 'naive-ui'
import { translateTermManager } from '@/renderer/service/manager/TranslateTermManager';
import HelpFloatButton from '@/renderer/components/common/HelpFloatButton.vue' 
const dialog = useDialog();
const message = useMessage();
 

interface TermItem {
  id?: number; // 改为可选属性
  sourceTerm: string
  translatedTerm: string
}

const data = ref<TermItem[]>([
  {
    id: 1, // 改为id
    sourceTerm: '示例术语',
    translatedTerm: 'example term'
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
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.pagination-wrapper {
  margin-top: 2px;
  padding: 2px 0;
}
/* 新增表格滚动条样式 */
.n-data-table {
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
}

</style>
 
