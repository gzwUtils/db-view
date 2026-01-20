<template>
  <div class="simple-data-table">
    <div v-if="showHeader" class="table-header">
      <span class="table-title">{{ title }}</span>
      <div class="table-actions">
        <el-input
          v-if="searchable"
          v-model="searchText"
          placeholder="搜索..."
          size="small"
          clearable
          style="width: 200px; margin-right: 10px;"
          @input="handleSearch"
        />
        <el-button v-if="exportable" size="small" @click="exportData">
          <el-icon><Download /></el-icon>
        </el-button>
      </div>
    </div>

    <el-table
      :data="filteredData"
      :border="border"
      :stripe="stripe"
      :height="height"
      style="width: 100%"
      @row-click="handleRowClick"
    >
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="60"
        align="center"
      />

      <template v-for="column in columns" :key="column.prop">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :sortable="column.sortable"
          :show-overflow-tooltip="column.tooltip"
        >
          <template #default="scope">
            <span>{{ scope.row[column.prop] }}</span>
          </template>
        </el-table-column>
      </template>

      <slot name="actions" v-if="$slots.actions">
        <el-table-column
          label="操作"
          :width="actionsWidth"
          align="center"
          fixed="right"
        >
          <template #default="scope">
            <slot name="actions" :row="scope.row" />
          </template>
        </el-table-column>
      </slot>
    </el-table>

    <div v-if="pagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :layout="layout"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'

const props = defineProps({
  // 数据
  data: {
    type: Array,
    default: () => []
  },

  // 列配置
  columns: {
    type: Array,
    default: () => []
  },

  // 表格属性
  border: {
    type: Boolean,
    default: true
  },
  stripe: {
    type: Boolean,
    default: true
  },
  height: [String, Number],

  // 头部
  showHeader: {
    type: Boolean,
    default: true
  },
  title: String,
  searchable: Boolean,
  exportable: Boolean,

  // 索引
  showIndex: Boolean,

  // 分页
  pagination: {
    type: Boolean,
    default: false
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },

  // 操作列宽度
  actionsWidth: {
    type: String,
    default: '120'
  }
})

const emit = defineEmits([
  'row-click',
  'page-change',
  'size-change',
  'export'
])

// 搜索
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 计算总记录数
const total = computed(() => props.data.length)

// 处理搜索
const filteredData = computed(() => {
  let result = [...props.data]

  // 搜索过滤
  if (searchText.value && props.columns.length > 0) {
    const keyword = searchText.value.toLowerCase()
    result = result.filter(row => {
      return props.columns.some(col => {
        const value = row[col.prop]
        return value && value.toString().toLowerCase().includes(keyword)
      })
    })
  }

  // 分页
  if (props.pagination) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    result = result.slice(start, end)
  }

  return result
})

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 分页变化
const handlePageChange = (page) => {
  emit('page-change', page)
}

const handleSizeChange = (size) => {
  pageSize.value = size
  emit('size-change', size)
}

// 行点击
const handleRowClick = (row, column, event) => {
  emit('row-click', { row, column, event })
}

// 导出数据
const exportData = () => {
  emit('export', {
    data: props.data,
    columns: props.columns
  })
}

// 监听数据变化，重置分页
watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.simple-data-table {
  width: 100%;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  align-items: center;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 0 4px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f5f7fa !important;
  font-weight: 600;
  color: #303133;
}

:deep(.el-table__body tr:hover) {
  background-color: #f5f7fa !important;
}
</style>