<template>
  <div>
    <h2 style="margin-bottom: 20px;">数据导入导出</h2>

    <el-row :gutter="20">
      <!-- 导出功能 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>数据导出</span>
              <el-button type="primary" size="small" @click="downloadTemplate">
                <el-icon><Download /></el-icon>下载模板
              </el-button>
            </div>
          </template>

          <el-form :model="exportForm" label-width="100px">
            <el-form-item label="选择数据库">
              <el-select v-model="exportForm.database" @change="loadTables" clearable>
                <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
              </el-select>
            </el-form-item>

            <el-form-item label="选择表" prop="tableName">
              <el-select v-model="exportForm.tableName" placeholder="请选择表" :disabled="!exportForm.database">
                <el-option v-for="table in tables" :key="table" :label="table" :value="table" />
              </el-select>
            </el-form-item>

            <el-form-item label="导出格式">
              <el-radio-group v-model="exportForm.format">
                <el-radio label="excel">Excel (.xlsx)</el-radio>
                <el-radio label="csv">CSV (.csv)</el-radio>
                <el-radio label="json">JSON (.json)</el-radio>
                <el-radio label="sql">SQL (.sql)</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="数据筛选">
              <el-input
                v-model="exportForm.whereClause"
                type="textarea"
                :rows="2"
                placeholder="WHERE条件，例如：status=1 AND create_time > '2023-01-01'"
              />
              <div style="font-size: 12px; color: #666; margin-top: 5px;">
                提示：留空则导出全部数据
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleExport" :loading="exporting">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
              <el-button @click="resetExportForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 导入功能 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>数据导入</span>
          </template>

          <el-tabs v-model="activeImportTab">
            <!-- CSV导入 -->
            <el-tab-pane label="CSV导入" name="csv">
              <el-form :model="csvImportForm" label-width="100px">
                <el-form-item label="选择数据库">
                  <el-select v-model="csvImportForm.database" @change="loadTablesForImport" clearable>
                    <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
                  </el-select>
                </el-form-item>

                <el-form-item label="目标表" prop="tableName">
                  <el-select v-model="csvImportForm.tableName" placeholder="请选择表" :disabled="!csvImportForm.database">
                    <el-option v-for="table in importTables" :key="table" :label="table" :value="table" />
                  </el-select>
                </el-form-item>

                <el-form-item label="导入选项">
                  <el-checkbox v-model="csvImportForm.truncateFirst">导入前清空表数据</el-checkbox>
                  <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ⚠️ 警告：勾选此选项会删除表中所有现有数据
                  </div>
                </el-form-item>

                <el-form-item label="选择文件">
                  <el-upload
                    class="upload-demo"
                    drag
                    :action="csvImportUrl"
                    :headers="uploadHeaders"
                    :data="csvImportData"
                    :on-success="handleCsvImportSuccess"
                    :on-error="handleImportError"
                    :before-upload="beforeCsvUpload"
                    :show-file-list="false"
                    accept=".csv"
                  >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                      拖拽CSV文件到此处或 <em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        仅支持CSV格式，文件大小不超过10MB
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- Excel导入 -->
            <el-tab-pane label="Excel导入" name="excel">
              <el-form :model="excelImportForm" label-width="100px">
                <el-form-item label="选择数据库">
                  <el-select v-model="excelImportForm.database" @change="loadTablesForImport" clearable>
                    <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
                  </el-select>
                </el-form-item>

                <el-form-item label="目标表" prop="tableName">
                  <el-select v-model="excelImportForm.tableName" placeholder="请选择表" :disabled="!excelImportForm.database">
                    <el-option v-for="table in importTables" :key="table" :label="table" :value="table" />
                  </el-select>
                </el-form-item>

                <el-form-item label="导入选项">
                  <el-checkbox v-model="excelImportForm.truncateFirst">导入前清空表数据</el-checkbox>
                  <div style="font-size: 12px; color: #999; margin-top: 5px;">
                    ⚠️ 警告：勾选此选项会删除表中所有现有数据
                  </div>
                </el-form-item>

                <el-form-item label="选择文件">
                  <el-upload
                    class="upload-demo"
                    drag
                    :action="excelImportUrl"
                    :headers="uploadHeaders"
                    :data="excelImportData"
                    :on-success="handleExcelImportSuccess"
                    :on-error="handleImportError"
                    :before-upload="beforeExcelUpload"
                    :show-file-list="false"
                    accept=".xlsx,.xls"
                  >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                      拖拽Excel文件到此处或 <em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        支持.xlsx和.xls格式，文件大小不超过10MB
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- SQL导入 -->
            <el-tab-pane label="SQL导入" name="sql">
              <el-form :model="sqlImportForm" label-width="100px">
                <el-form-item label="选择数据库">
                  <el-select v-model="sqlImportForm.database" @change="loadTablesForImport" clearable>
                    <el-option v-for="db in databases" :key="db" :label="db" :value="db" />
                  </el-select>
                </el-form-item>

                <el-form-item label="SQL文件">
                  <div style="margin-bottom: 10px; color: #666;">
                    请确保SQL文件中的表在当前数据库中已存在
                  </div>
                  <el-upload
                    class="upload-demo"
                    drag
                    :action="sqlImportUrl"
                    :headers="uploadHeaders"
                    :on-success="handleSqlImportSuccess"
                    :on-error="handleImportError"
                    :before-upload="beforeSqlUpload"
                    :show-file-list="false"
                    accept=".sql"
                  >
                    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                    <div class="el-upload__text">
                      拖拽SQL文件到此处或 <em>点击上传</em>
                    </div>
                    <template #tip>
                      <div class="el-upload__tip">
                        仅支持SQL格式，文件大小不超过10MB
                      </div>
                    </template>
                  </el-upload>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入结果对话框 -->
    <el-dialog
      v-model="importResultDialogVisible"
      :title="importResultTitle"
      width="600px"
      @closed="closeImportResultDialog"
    >
      <div v-if="importResult">
        <el-alert
          :type="importResult.errorRows > 0 ? 'warning' : 'success'"
          :title="`导入完成，成功${importResult.importedRows}条，失败${importResult.errorRows}条，耗时${importResult.costTime}ms`"
          :closable="false"
          style="margin-bottom: 20px;"
        />

        <div v-if="importResult.errorRows > 0 && importResult.errorDetails && importResult.errorDetails.length > 0">
          <h4>错误详情：</h4>
          <div style="max-height: 300px; overflow-y: auto;">
            <el-table :data="importResult.errorDetails" size="small" border>
              <el-table-column prop="__error" label="错误信息" />
              <el-table-column label="数据预览" width="150">
                <template #default="{ row }">
                  <el-button type="text" @click="showErrorData(row)">查看数据</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importResultDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 错误数据详情对话框 -->
    <el-dialog
      v-model="errorDataDialogVisible"
      title="错误数据详情"
      width="800px"
    >
      <div v-if="currentErrorData">
        <el-table :data="[currentErrorData]" border>
          <el-table-column
            v-for="(value, key) in currentErrorData"
            :key="key"
            :prop="key"
            :label="key"
            :show-overflow-tooltip="true"
          />
        </el-table>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="errorDataDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'  // 添加watch导入
import { ElMessage } from 'element-plus'
import { Download, UploadFilled } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const databases = ref([])
const tables = ref([])
const importTables = ref([])
const exporting = ref(false)
const importResultDialogVisible = ref(false)
const importResult = ref(null)
const importResultTitle = ref('')
const errorDataDialogVisible = ref(false)
const currentErrorData = ref(null)
const activeImportTab = ref('csv')

// 导出表单
const exportForm = ref({
  database: '',
  tableName: '',
  format: 'excel',
  whereClause: ''
})

// CSV导入表单
const csvImportForm = ref({
  database: '',
  tableName: '',
  truncateFirst: false
})

// Excel导入表单
const excelImportForm = ref({
  database: '',
  tableName: '',
  truncateFirst: false
})

// SQL导入表单
const sqlImportForm = ref({
  database: '',
  tableName: ''
})

// 计算属性
const uploadHeaders = computed(() => {
  const headers = {}
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
})

const csvImportUrl = computed(() => '/api/data/import/csv')
const excelImportUrl = computed(() => '/api/data/import/excel')
const sqlImportUrl = computed(() => '/api/data/import/sql')

const csvImportData = computed(() => ({
  tableName: csvImportForm.value.tableName,
  truncateFirst: csvImportForm.value.truncateFirst
}))

const excelImportData = computed(() => ({
  tableName: excelImportForm.value.tableName,
  truncateFirst: excelImportForm.value.truncateFirst
}))

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

// 加载表列表
const loadTables = async () => {
  if (!exportForm.value.database) {
    tables.value = []
    return
  }

  try {
    // 切换到指定数据库
    await dbApi.switchDatabase(exportForm.value.database)
    const response = await dbApi.getTables()
    if (response.success) {
      tables.value = response.result.map(table => table.TABLE_NAME) || []
    }
  } catch (error) {
    console.error('加载表列表失败:', error)
    ElMessage.error('加载表列表失败: ' + error.message)
  }
}

// 为导入加载表列表
const loadTablesForImport = async () => {
  let database = null
  if (activeImportTab.value === 'csv') {
    database = csvImportForm.value.database
  } else if (activeImportTab.value === 'excel') {
    database = excelImportForm.value.database
  } else {
    database = sqlImportForm.value.database
  }

  if (!database) {
    importTables.value = []
    return
  }

  try {
    // 切换到指定数据库
    await dbApi.switchDatabase(database)
    const response = await dbApi.getTables()
    if (response.success) {
      importTables.value = response.result.map(table => table.TABLE_NAME) || []
    }
  } catch (error) {
    console.error('加载表列表失败:', error)
    ElMessage.error('加载表列表失败: ' + error.message)
  }
}

// 处理导出
const handleExport = async () => {
  if (!exportForm.value.database) {
    ElMessage.warning('请选择数据库')
    return
  }

  if (!exportForm.value.tableName) {
    ElMessage.warning('请选择表')
    return
  }

  exporting.value = true

  try {
    // 切换到指定数据库
    await dbApi.switchDatabase(exportForm.value.database)

    // 构建请求数据
    const requestData = {
      tableName: exportForm.value.tableName,
      format: exportForm.value.format,
      whereClause: exportForm.value.whereClause
    }

    // 使用fetch进行文件下载
    const token = localStorage.getItem('token')
    const response = await fetch('/api/data/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Database': exportForm.value.database,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '导出失败')
    }

    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition')
    let filename = `${exportForm.value.tableName}_export.${exportForm.value.format}`
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    // 创建下载链接
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    ElMessage.success('导出成功')

  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + (error.message || error))
  } finally {
    exporting.value = false
  }
}

// 重置导出表单
const resetExportForm = () => {
  exportForm.value = {
    database: '',
    tableName: '',
    format: 'excel',
    whereClause: ''
  }
  tables.value = []
}

// 下载模板
const downloadTemplate = async () => {
  if (!exportForm.value.database) {
    ElMessage.warning('请先选择数据库')
    return
  }

  if (!exportForm.value.tableName) {
    ElMessage.warning('请先选择表')
    return
  }

  const url = `/api/data/template?tableName=${encodeURIComponent(exportForm.value.tableName)}`
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Database': exportForm.value.database,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || '下载模板失败')
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${exportForm.value.tableName}_template.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(a)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('下载模板失败:', e)
    ElMessage.error('下载模板失败: ' + (e.message || e))
  }
}

// 上传前验证
const beforeCsvUpload = (file) => {
  if (!csvImportForm.value.database) {
    ElMessage.warning('请先选择数据库')
    return false
  }

  if (!csvImportForm.value.tableName) {
    ElMessage.warning('请先选择目标表')
    return false
  }

  const isCsv = file.name.toLowerCase().endsWith('.csv')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isCsv) {
    ElMessage.error('只能上传CSV格式文件!')
    return false
  }

  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }

  return true
}

const beforeExcelUpload = (file) => {
  if (!excelImportForm.value.database) {
    ElMessage.warning('请先选择数据库')
    return false
  }

  if (!excelImportForm.value.tableName) {
    ElMessage.warning('请先选择目标表')
    return false
  }

  const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传Excel格式文件!')
    return false
  }

  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }

  return true
}

const beforeSqlUpload = (file) => {
  if (!sqlImportForm.value.database) {
    ElMessage.warning('请先选择数据库')
    return false
  }

  const isSql = file.name.toLowerCase().endsWith('.sql')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isSql) {
    ElMessage.error('只能上传SQL格式文件!')
    return false
  }

  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }

  return true
}

// 导入成功处理
const handleCsvImportSuccess = (response) => {
  if (response.success) {
    importResult.value = response.result
    importResultTitle.value = 'CSV导入结果'
    importResultDialogVisible.value = true
    ElMessage.success('CSV导入成功')
  } else {
    ElMessage.error('CSV导入失败: ' + response.message)
  }
}

const handleExcelImportSuccess = (response) => {
  if (response.success) {
    importResult.value = response.result
    importResultTitle.value = 'Excel导入结果'
    importResultDialogVisible.value = true
    ElMessage.success('Excel导入成功')
  } else {
    ElMessage.error('Excel导入失败: ' + response.message)
  }
}

const handleSqlImportSuccess = (response) => {
  if (response.success) {
    importResult.value = response.result
    importResultTitle.value = 'SQL导入结果'
    importResultDialogVisible.value = true
    ElMessage.success('SQL导入成功')
  } else {
    ElMessage.error('SQL导入失败: ' + response.message)
  }
}

// 导入错误处理
const handleImportError = (error) => {
  console.error('导入失败:', error)
  ElMessage.error('导入失败: ' + (error.message || '未知错误'))
}

// 关闭导入结果对话框
const closeImportResultDialog = () => {
  importResult.value = null
}

// 显示错误数据
const showErrorData = (row) => {
  currentErrorData.value = row
  errorDataDialogVisible.value = true
}

// 监听导入标签切换
watch(activeImportTab, (newVal) => {
  // 当切换标签时，重新加载表列表
  if (newVal === 'csv' && csvImportForm.value.database) {
    loadTablesForImport()
  } else if (newVal === 'excel' && excelImportForm.value.database) {
    loadTablesForImport()
  } else if (newVal === 'sql' && sqlImportForm.value.database) {
    loadTablesForImport()
  }
})

onMounted(() => {
  loadDatabases()
})
</script>

<style scoped>
.upload-demo {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 180px;
}

:deep(.el-upload__text) {
  margin: 20px 0;
}

:deep(.el-table) {
  margin-top: 10px;
}

.el-card {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-radio {
  margin-right: 0;
}
</style>
