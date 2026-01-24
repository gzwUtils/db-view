<template>
  <div>
    <h2 style="margin-bottom: 20px;">历史记录与操作日志</h2>

    <el-tabs v-model="activeTab">
      <!-- SQL历史记录 -->
      <el-tab-pane label="SQL历史记录" name="sql">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>SQL历史记录</span>
              <div>
                <el-button type="danger" size="small" @click="clearSqlHistory">
                  <el-icon><Delete /></el-icon>清空历史
                </el-button>
              </div>
            </div>
          </template>

          <!-- 查询条件 -->
          <div class="search-container">
            <el-form :model="sqlHistoryQuery" :inline="true" class="search-form">
              <el-form-item label="数据库" class="search-item">
                <el-select
                  v-model="sqlHistoryQuery.database"
                  clearable
                  placeholder="全部数据库"
                  style="width: 180px;"
                >
                  <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
                </el-select>
              </el-form-item>

              <el-form-item label="时间范围" class="search-item">
                <el-date-picker
                  v-model="sqlHistoryQuery.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 360px;"
                  @change="loadSqlHistory"
                />
              </el-form-item>

              <el-form-item label="执行状态" class="search-item">
                <el-select
                  v-model="sqlHistoryQuery.success"
                  clearable
                  placeholder="全部状态"
                  style="width: 120px;"
                >
                  <el-option label="成功" :value="true" />
                  <el-option label="失败" :value="false" />
                </el-select>
              </el-form-item>

              <el-form-item class="search-item search-buttons">
                <el-button type="primary" @click="loadSqlHistory">
                  <el-icon><Search /></el-icon>查询
                </el-button>
                <el-button @click="resetSqlHistoryQuery">
                  <el-icon><Refresh /></el-icon>重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据表格 -->
          <el-table
            :data="sqlHistoryData"
            v-loading="sqlHistoryLoading"
            border
            style="width: 100%"
            @row-click="showSqlDetail"
          >
            <el-table-column prop="databaseName" label="数据库" width="120" />
            <el-table-column prop="sqlText" label="SQL语句" min-width="300" show-overflow-tooltip>
              <template #default="{ row }">
                <div style="font-family: 'Courier New', monospace; font-size: 12px;">
                  {{ row.sqlText }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="executeTime" label="执行时间" width="160" />
            <el-table-column prop="costTime" label="耗时(ms)" width="100" align="right">
              <template #default="{ row }">
                <el-tag :type="getTimeTagType(row.costTime)" size="small">
                  {{ row.costTime }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="resultCount" label="结果数" width="90" align="right" />
            <el-table-column prop="success" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                  {{ row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="errorMessage" label="错误信息" width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="text" size="small" @click.stop="reExecuteSql(row)">
                  重试
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <el-pagination
              v-model:current-page="sqlHistoryPage"
              v-model:page-size="sqlHistoryPageSize"
              :total="sqlHistoryTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSqlHistorySizeChange"
              @current-change="handleSqlHistoryPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 操作日志 -->
      <el-tab-pane label="操作日志" name="operation">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>操作日志</span>
              <div>
                <el-button type="danger" size="small" @click="clearOperationLogs">
                  <el-icon><Delete /></el-icon>清空日志
                </el-button>
              </div>
            </div>
          </template>

          <!-- 查询条件 -->
          <div class="search-container">
            <el-form :model="operationLogQuery" :inline="true" class="search-form">
              <el-form-item label="数据库" class="search-item">
                <el-select
                  v-model="operationLogQuery.database"
                  clearable
                  placeholder="全部数据库"
                  style="width: 180px;"
                >
                  <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
                </el-select>
              </el-form-item>

              <el-form-item label="操作类型" class="search-item">
                <el-select
                  v-model="operationLogQuery.operationType"
                  clearable
                  placeholder="全部类型"
                  style="width: 120px;"
                >
                  <el-option label="查询" value="QUERY" />
                  <el-option label="插入" value="INSERT" />
                  <el-option label="更新" value="UPDATE" />
                  <el-option label="删除" value="DELETE" />
                  <el-option label="导出" value="EXPORT" />
                  <el-option label="导入" value="IMPORT" />
                  <el-option label="创建" value="CREATE" />
                  <el-option label="修改" value="ALTER" />
                  <el-option label="错误" value="ERROR" />
                  <el-option label="其他" value="OTHER" />
                </el-select>
              </el-form-item>

              <el-form-item label="时间范围" class="search-item">
                <el-date-picker
                  v-model="operationLogQuery.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  style="width: 360px;"
                  @change="loadOperationLogs"
                />
              </el-form-item>

              <el-form-item label="操作状态" class="search-item">
                <el-select
                  v-model="operationLogQuery.success"
                  clearable
                  placeholder="全部状态"
                  style="width: 120px;"
                >
                  <el-option label="成功" :value="true" />
                  <el-option label="失败" :value="false" />
                </el-select>
              </el-form-item>

              <el-form-item class="search-item search-buttons">
                <el-button type="primary" @click="loadOperationLogs">
                  <el-icon><Search /></el-icon>查询
                </el-button>
                <el-button @click="resetOperationLogQuery">
                  <el-icon><Refresh /></el-icon>重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据表格 -->
          <el-table
            :data="operationLogData"
            v-loading="operationLogLoading"
            border
            style="width: 100%"
          >
            <el-table-column prop="databaseName" label="数据库" width="120" />
            <el-table-column prop="operationType" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getOperationTypeTag(row.operationType)" size="small">
                  {{ row.operationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tableName" label="表名" width="150" show-overflow-tooltip />
            <el-table-column prop="sqlText" label="SQL/操作" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div style="font-family: 'Courier New', monospace; font-size: 12px;">
                  {{ row.sqlText }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="affectedRows" label="影响行数" width="100" align="right" />
            <el-table-column prop="executeTime" label="操作时间" width="160" />
            <el-table-column prop="success" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                  {{ row.success ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="操作结果" width="200" show-overflow-tooltip />
          </el-table>

          <!-- 分页 -->
          <div style="display: flex; justify-content: center; margin-top: 20px;">
            <el-pagination
              v-model:current-page="operationLogPage"
              v-model:page-size="operationLogPageSize"
              :total="operationLogTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleOperationLogSizeChange"
              @current-change="handleOperationLogPageChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- SQL详情对话框 -->
    <el-dialog
      v-model="sqlDetailDialogVisible"
      :title="sqlDetailTitle"
      width="800px"
      @closed="closeSqlDetailDialog"
    >
      <div v-if="currentSqlDetail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="数据库">
            {{ currentSqlDetail.databaseName || currentSqlDetail.database }}
          </el-descriptions-item>
          <el-descriptions-item label="执行时间">
            {{ formatDateTime(currentSqlDetail.executeTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            <el-tag :type="getTimeTagType(currentSqlDetail.costTime)" size="small">
              {{ currentSqlDetail.costTime }}ms
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="currentSqlDetail.success ? 'success' : 'danger'" size="small">
              {{ currentSqlDetail.success ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="结果数量">
            {{ currentSqlDetail.resultCount || 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px;">
          <h4>SQL语句：</h4>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace;">
            <pre style="margin: 0; white-space: pre-wrap;">{{ currentSqlDetail.sqlText }}</pre>
          </div>
        </div>

        <div v-if="currentSqlDetail.errorMessage" style="margin-top: 20px;">
          <h4 style="color: #f56c6c;">错误信息：</h4>
          <div style="background: #fef0f0; padding: 10px; border-radius: 4px; color: #f56c6c;">
            {{ currentSqlDetail.errorMessage }}
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sqlDetailDialogVisible = false">关闭</el-button>
          <el-button v-if="currentSqlDetail" type="primary" @click="copySql">
            <el-icon><CopyDocument /></el-icon>复制SQL
          </el-button>
          <el-button v-if="currentSqlDetail && !currentSqlDetail.success" type="warning" @click="reExecuteCurrentSql">
            <el-icon><Refresh /></el-icon>重试执行
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, CopyDocument } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const activeTab = ref('sql')
const databases = ref([])

// SQL历史记录相关
const sqlHistoryData = ref([])
const sqlHistoryLoading = ref(false)
const sqlHistoryPage = ref(1)
const sqlHistoryPageSize = ref(20)
const sqlHistoryTotal = ref(0)
const sqlHistoryQuery = ref({
  database: '',
  dateRange: [],
  success: null
})

// 操作日志相关
const operationLogData = ref([])
const operationLogLoading = ref(false)
const operationLogPage = ref(1)
const operationLogPageSize = ref(20)
const operationLogTotal = ref(0)
const operationLogQuery = ref({
  database: '',
  operationType: '',
  dateRange: [],
  success: null
})

// SQL详情对话框
const sqlDetailDialogVisible = ref(false)
const sqlDetailTitle = ref('SQL详情')
const currentSqlDetail = ref(null)

// 加载数据库列表
const loadDatabases = async () => {
  try {
    const response = await dbApi.getDatabases()
    if (response.success) {
      databases.value = response.result || []
    }
  } catch (error) {
    console.error('加载数据库列表失败:', error)
  }
}

// 加载SQL历史记录
const loadSqlHistory = async () => {
  sqlHistoryLoading.value = true

  try {
    const params = {
      page: sqlHistoryPage.value,
      size: sqlHistoryPageSize.value
    }

    // 添加查询条件
    if (sqlHistoryQuery.value.database) {
      params.database = sqlHistoryQuery.value.database
    }

    if (sqlHistoryQuery.value.dateRange && sqlHistoryQuery.value.dateRange.length === 2) {
      params.startTime = sqlHistoryQuery.value.dateRange[0]
      params.endTime = sqlHistoryQuery.value.dateRange[1]
    }

    if (sqlHistoryQuery.value.success !== null) {
      params.success = sqlHistoryQuery.value.success
    }

    // 使用API封装的方法
    const response = await dbApi.getSqlHistory(params)

    if (response.success) {
      sqlHistoryData.value = response.result.data || []
      sqlHistoryTotal.value = response.result.total || 0
    } else {
      ElMessage.error(response.message || '加载SQL历史记录失败')
    }
  } catch (error) {
    console.error('加载SQL历史记录失败:', error)
    ElMessage.error('加载SQL历史记录失败')
  } finally {
    sqlHistoryLoading.value = false
  }
}

// 加载操作日志
const loadOperationLogs = async () => {
  operationLogLoading.value = true

  try {
    const params = {
      page: operationLogPage.value,
      size: operationLogPageSize.value
    }

    // 添加查询条件
    if (operationLogQuery.value.database) {
      params.database = operationLogQuery.value.database
    }

    if (operationLogQuery.value.operationType) {
      params.operationType = operationLogQuery.value.operationType
    }

    if (operationLogQuery.value.dateRange && operationLogQuery.value.dateRange.length === 2) {
      params.startTime = operationLogQuery.value.dateRange[0]
      params.endTime = operationLogQuery.value.dateRange[1]
    }

    if (operationLogQuery.value.success !== null) {
      params.success = operationLogQuery.value.success
    }

    // 使用API封装的方法
    const response = await dbApi.getOperationLogs(params)

    if (response.success) {
      operationLogData.value = response.result.data || []
      operationLogTotal.value = response.result.total || 0
    } else {
      ElMessage.error(response.message || '加载操作日志失败')
    }
  } catch (error) {
    console.error('加载操作日志失败:', error)
    ElMessage.error('加载操作日志失败')
  } finally {
    operationLogLoading.value = false
  }
}

// 重置SQL历史记录查询条件
const resetSqlHistoryQuery = () => {
  sqlHistoryQuery.value = {
    database: '',
    dateRange: [],
    success: null
  }
  sqlHistoryPage.value = 1
  loadSqlHistory()
}

// 重置操作日志查询条件
const resetOperationLogQuery = () => {
  operationLogQuery.value = {
    database: '',
    operationType: '',
    dateRange: [],
    success: null
  }
  operationLogPage.value = 1
  loadOperationLogs()
}

// SQL历史记录分页大小变化
const handleSqlHistorySizeChange = (size) => {
  sqlHistoryPageSize.value = size
  sqlHistoryPage.value = 1
  loadSqlHistory()
}

// SQL历史记录页码变化
const handleSqlHistoryPageChange = (page) => {
  sqlHistoryPage.value = page
  loadSqlHistory()
}

// 操作日志分页大小变化
const handleOperationLogSizeChange = (size) => {
  operationLogPageSize.value = size
  operationLogPage.value = 1
  loadOperationLogs()
}

// 操作日志页码变化
const handleOperationLogPageChange = (page) => {
  operationLogPage.value = page
  loadOperationLogs()
}

// 显示SQL详情
const showSqlDetail = (row) => {
  currentSqlDetail.value = row
  sqlDetailTitle.value = `SQL详情 - ${row.databaseName || row.database}`
  sqlDetailDialogVisible.value = true
}

// 关闭SQL详情对话框
const closeSqlDetailDialog = () => {
  currentSqlDetail.value = null
}

// 复制SQL - 修复clipboard兼容性问题
const copySql = async () => {
  if (!currentSqlDetail.value) return

  const sql = currentSqlDetail.value.sqlText || currentSqlDetail.value.sql
  if (!sql) {
    ElMessage.warning('没有可复制的SQL语句')
    return
  }

  try {
    // 方法1: 使用现代Clipboard API（首选）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(sql)
      ElMessage.success('SQL已复制到剪贴板')
      return
    }

    // 方法2: 使用document.execCommand作为回退方案
    const textArea = document.createElement('textarea')
    textArea.value = sql
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (successful) {
      ElMessage.success('SQL已复制到剪贴板')
    } else {
      // 方法3: 显示SQL让用户手动复制
      showManualCopyDialog(sql)
    }
  } catch (error) {
    console.error('复制失败:', error)
    // 显示SQL让用户手动复制
    showManualCopyDialog(sql)
  }
}

// 显示手动复制对话框
const showManualCopyDialog = (sql) => {
  ElMessageBox.confirm(
    `<div>
      <p>由于浏览器限制，无法自动复制。</p>
      <p>请手动复制以下SQL：</p>
      <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px;">
        <pre style="margin: 0; white-space: pre-wrap; max-height: 200px; overflow: auto;">${sql}</pre>
      </div>
      <p>按Ctrl+C或右键复制</p>
    </div>`,
    '手动复制',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定',
      cancelButtonText: '关闭',
      type: 'info'
    }
  )
}

// 重新执行SQL
const reExecuteSql = async (row) => {
  const sql = row.sqlText || row.sql
  const dbName = row.databaseName || row.database

  ElMessageBox.confirm(
    `确定要重新执行这条SQL吗？\n\n数据库: ${dbName}\nSQL: ${sql?.substring(0, 100)}...`,
    '确认重试',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 切换到对应数据库
      await dbApi.switchDatabase(dbName)

      // 执行SQL
      const response = await dbApi.executeQuery(sql)

      if (response.success) {
        ElMessage.success('SQL执行成功')

        // 重新加载历史记录
        if (activeTab.value === 'sql') {
          loadSqlHistory()
        }
      } else {
        ElMessage.error('SQL执行失败: ' + response.message)
      }
    } catch (error) {
      console.error('重试执行SQL失败:', error)
      ElMessage.error('重试执行失败: ' + error.message)
    }
  })
}

// 重新执行当前SQL
const reExecuteCurrentSql = async () => {
  if (!currentSqlDetail.value) return
  await reExecuteSql(currentSqlDetail.value)
  sqlDetailDialogVisible.value = false
}

// 清空SQL历史记录
const clearSqlHistory = () => {
  ElMessageBox.confirm(
    '确定要清空SQL历史记录吗？此操作不可恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const database = sqlHistoryQuery.value.database || ''
      const response = await dbApi.clearSqlHistory(database)

      if (response.success) {
        ElMessage.success(response.message || '清空成功')
        loadSqlHistory()
      } else {
        ElMessage.error(response.message || '清空失败')
      }
    } catch (error) {
      console.error('清空SQL历史记录失败:', error)
      ElMessage.error('清空失败: ' + error.message)
    }
  })
}

// 清空操作日志
const clearOperationLogs = () => {
  ElMessageBox.confirm(
    '确定要清空操作日志吗？此操作不可恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const database = operationLogQuery.value.database || ''
      const response = await dbApi.clearOperationLogs(database)

      if (response.success) {
        ElMessage.success(response.message || '清空成功')
        loadOperationLogs()
      } else {
        ElMessage.error(response.message || '清空失败')
      }
    } catch (error) {
      console.error('清空操作日志失败:', error)
      ElMessage.error('清空失败: ' + error.message)
    }
  })
}

// 根据耗时获取标签类型
const getTimeTagType = (time) => {
  if (!time) return 'info'
  if (time < 100) return 'success'
  if (time < 1000) return 'warning'
  return 'danger'
}

// 根据操作类型获取标签类型
const getOperationTypeTag = (type) => {
  switch (type) {
    case 'QUERY': return 'primary'
    case 'INSERT': return 'success'
    case 'UPDATE': return 'warning'
    case 'DELETE': return 'danger'
    case 'EXPORT': return 'info'
    case 'IMPORT': return ''
    case 'CREATE': return 'success'
    case 'ALTER': return 'warning'
    case 'ERROR': return 'danger'
    default: return 'info'
  }
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  // 如果已经是字符串，直接返回
  if (typeof dateTime === 'string') return dateTime
  // 如果是日期对象，格式化
  if (dateTime instanceof Date) {
    return dateTime.toLocaleString('zh-CN')
  }
  return String(dateTime)
}

onMounted(() => {
  loadDatabases()
  loadSqlHistory()
  loadOperationLogs()
})
</script>

<style scoped>
/* 搜索容器样式 */
.search-container {
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

/* 搜索表单样式 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

/* 搜索项样式 */
.search-item {
  margin-bottom: 10px;
  margin-right: 20px;
}

/* 搜索按钮样式 */
.search-buttons {
  margin-left: auto;
}

/* 表单标签样式 */
.search-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

/* 输入框和选择框样式 */
.search-form :deep(.el-input),
.search-form :deep(.el-select) {
  min-width: 180px;
}

/* 日期选择器样式 */
.search-form :deep(.el-date-editor) {
  min-width: 360px;
}

/* 按钮样式 */
.search-buttons :deep(.el-button) {
  margin-left: 10px;
}

/* 表格样式 */
.el-table {
  margin-top: 10px;
}

.el-table :deep(.el-table__row) {
  cursor: pointer;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

/* 分页样式 */
.el-pagination {
  margin-top: 20px;
}

/* 标签样式 */
.el-tag {
  margin: 2px;
}

/* SQL显示样式 */
pre {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
}

/* 对话框底部样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .search-form {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-item {
    width: 100%;
    margin-right: 0;
  }

  .search-form :deep(.el-date-editor) {
    width: 100% !important;
    min-width: unset;
  }

  .search-form :deep(.el-input),
  .search-form :deep(.el-select) {
    width: 100% !important;
    min-width: unset;
  }

  .search-buttons {
    margin-left: 0;
    width: 100%;
  }

  .search-buttons :deep(.el-button) {
    margin-left: 0;
    margin-right: 10px;
  }
}
</style>