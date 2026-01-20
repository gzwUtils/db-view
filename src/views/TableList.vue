<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h2 style="margin-bottom: 10px;">数据表列表</h2>
      <el-button type="primary" @click="refreshTables" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div v-if="loading" style="text-align: center; padding: 50px;">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" style="color: red; padding: 20px; background: #fef0f0; border-radius: 4px;">
      {{ error }}
    </div>

    <div v-else-if="tables.length > 0">
      <el-table
        :data="tables"
        border
        style="width: 100%"
        @row-click="viewTableDetail"
        :key="tableKey"
        row-key="TABLE_NAME"
      >
        <el-table-column prop="TABLE_NAME" label="表名" width="200">
          <template #default="{ row }">
            <el-icon style="margin-right: 8px;"><Document /></el-icon>
            {{ row.TABLE_NAME }}
            <span v-if="row.TABLE_COMMENT" style="color: #666; font-size: 12px; margin-left: 8px;">
              ({{ row.TABLE_COMMENT }})
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="TABLE_ROWS" label="行数" width="100" />
        <el-table-column label="大小" width="120">
          <template #default="{ row }">
            {{ formatSize(row.TOTAL_SIZE) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.CREATE_TIME) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click.stop="viewTableStructure(row.TABLE_NAME)">
              结构
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog
        v-model="structureDialogVisible"
        :title="`${currentTable} - 表结构`"
        width="80%"
        :destroy-on-close="true"
        @closed="handleDialogClosed"
      >
        <div v-if="tableStructureLoading" style="text-align: center; padding: 20px;">
          <el-icon class="is-loading"><Loading /></el-icon>
          加载中...
        </div>
        <div v-else-if="tableStructureError" style="color: red; padding: 20px;">
          {{ tableStructureError }}
        </div>
        <el-table v-else :data="tableStructure" border style="width: 100%">
          <el-table-column prop="COLUMN_NAME" label="字段名" width="150" />
          <el-table-column prop="COLUMN_TYPE" label="类型" width="150" />
          <el-table-column prop="IS_NULLABLE" label="允许空值" width="100">
            <template #default="{ row }">
              {{ row.IS_NULLABLE === 'YES' ? '是' : '否' }}
            </template>
          </el-table-column>
          <el-table-column prop="COLUMN_KEY" label="键" width="80" />
          <el-table-column prop="COLUMN_DEFAULT" label="默认值" width="120" />
          <el-table-column prop="EXTRA" label="额外" width="100" />
          <el-table-column prop="COLUMN_COMMENT" label="注释" />
        </el-table>
      </el-dialog>
    </div>

    <div v-else style="text-align: center; padding: 50px;">
      <el-empty description="暂无数据表" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, Document } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const tables = ref([])
const loading = ref(false)
const error = ref('')
const structureDialogVisible = ref(false)
const currentTable = ref('')
const tableStructure = ref([])
const tableStructureLoading = ref(false)
const tableStructureError = ref('')
const tableKey = ref(0)

const refreshTables = async () => {
  loading.value = true
  error.value = ''
  try {
    const apiResponse = await dbApi.getTables()
    console.log('获取表列表API返回:', apiResponse)

    // 从axios响应中提取数据
    const response = apiResponse.data || apiResponse

    if (response.success && response.result) {
      tables.value = response.result
      // 强制重新渲染表格
      tableKey.value += 1
      ElMessage.success('表列表刷新成功')
    } else {
      error.value = response.msg || '获取表列表失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    console.error('获取表列表错误:', err)
    error.value = err.response?.data?.message || err.message || '获取表列表失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const viewTableDetail = (row) => {
  ElMessage.info(`查看表: ${row.TABLE_NAME}`)
}

const viewTableStructure = async (tableName) => {
  currentTable.value = tableName
  tableStructureLoading.value = true
  tableStructureError.value = ''
  tableStructure.value = [] // 清空旧数据

  try {
    const apiResponse = await dbApi.getTableStructure(tableName)
    console.log('获取表结构API返回:', apiResponse)

    const response = apiResponse.data || apiResponse

    if (response.success && response.result) {
      // 确保返回的是数组
      tableStructure.value = Array.isArray(response.result) ? response.result : []
      structureDialogVisible.value = true
      console.log('表结构数据:', tableStructure.value)
    } else {
      tableStructureError.value = response.msg || '获取表结构失败'
      ElMessage.error(tableStructureError.value)
      structureDialogVisible.value = true
    }
  } catch (err) {
    console.error('获取表结构错误:', err)
    tableStructureError.value = err.response?.data?.message || err.message || '获取表结构失败'
    ElMessage.error(tableStructureError.value)
    structureDialogVisible.value = true
  } finally {
    tableStructureLoading.value = false
  }
}

const handleDialogClosed = () => {
  // 对话框关闭时重置状态
  currentTable.value = ''
  tableStructure.value = []
  tableStructureError.value = ''
}

// 格式化文件大小
const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (timeString) => {
  if (!timeString) return ''
  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

onMounted(() => {
  refreshTables()
})
</script>