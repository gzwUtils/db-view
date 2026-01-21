<template>
  <div>
    <div style="margin-bottom: 20px;">
      <h2 style="margin-bottom: 10px;">数据表列表</h2>

      <!-- 数据库管理区域 -->
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
        <!-- 当前数据库显示 -->
        <div style="display: flex; align-items: center;">
          <span style="margin-right: 8px;">当前数据库:</span>
          <el-tag :type="currentDatabase === 'default' ? 'info' : 'primary'" size="large">
            {{ currentDatabase }}
          </el-tag>
          <el-tooltip v-if="currentDatabase === 'default'" content="默认数据库，如需切换请先添加数据库配置" placement="top">
            <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>

        <!-- 数据库选择器 -->
        <el-select
          v-model="selectedDatabase"
          placeholder="选择数据库"
          style="width: 200px;"
          @change="handleDatabaseChange"
          :loading="loadingDatabases"
        >
          <el-option
            v-for="db in databases"
            :key="db"
            :label="db"
            :value="db"
          />
          <el-option disabled>
            <div style="text-align: center; color: #999;">-- 添加数据库 --</div>
          </el-option>
          <el-option @click="showAddDatabaseDialog = true">
            <div style="color: #409eff; text-align: center;">
              <el-icon><Plus /></el-icon>
              添加新数据库
            </div>
          </el-option>
        </el-select>

        <el-button type="primary" @click="refreshTables" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 数据库配置对话框 -->
    <el-dialog
      v-model="showAddDatabaseDialog"
      title="添加数据库配置"
      width="500px"
      @closed="resetDatabaseForm"
    >
      <el-form :model="databaseForm" :rules="databaseRules" ref="databaseFormRef" label-width="100px">
        <el-form-item label="数据库名称" prop="name">
          <el-input v-model="databaseForm.name" placeholder="请输入数据库唯一名称" />
        </el-form-item>
        <el-form-item label="连接地址" prop="url">
          <el-input v-model="databaseForm.url" placeholder="jdbc:mysql://localhost:3306/db_name" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="databaseForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="databaseForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="驱动类" prop="driverClassName">
          <el-select v-model="databaseForm.driverClassName" placeholder="请选择驱动">
            <el-option label="MySQL" value="com.mysql.cj.jdbc.Driver" />
            <el-option label="MySQL (旧版)" value="com.mysql.jdbc.Driver" />
            <el-option label="PostgreSQL" value="org.postgresql.Driver" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDatabaseDialog = false">取消</el-button>
          <el-button type="primary" @click="addDatabaseConfig" :loading="addingDatabase">
            添加
          </el-button>
        </span>
      </template>
    </el-dialog>

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
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, Document, InfoFilled, Plus } from '@element-plus/icons-vue'
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

// 数据库相关
const databases = ref(['default'])
const currentDatabase = ref('default')
const selectedDatabase = ref('default')
const loadingDatabases = ref(false)
const showAddDatabaseDialog = ref(false)
const addingDatabase = ref(false)
const databaseFormRef = ref()

const databaseForm = ref({
  name: '',
  url: '',
  username: '',
  password: '',
  driverClassName: 'com.mysql.cj.jdbc.Driver'
})

const databaseRules = {
  name: [{ required: true, message: '请输入数据库名称', trigger: 'blur' }],
  url: [{ required: true, message: '请输入连接地址', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  driverClassName: [{ required: true, message: '请选择驱动', trigger: 'change' }]
}

// 监听当前数据库变化
watch(currentDatabase, (newVal) => {
  selectedDatabase.value = newVal
  // 刷新表列表
  if (newVal && newVal !== 'default') {
    refreshTables()
  }
})

// 加载数据库列表
const loadDatabases = async () => {
  loadingDatabases.value = true
  try {
    const response = await dbApi.getDatabases()
    if (response.success) {
      databases.value = response.result || []
      // 如果没有数据库，至少包含default
      if (databases.value.length === 0) {
        databases.value = ['default']
      }
    }
  } catch (error) {
    console.error('加载数据库列表失败:', error)
  } finally {
    loadingDatabases.value = false
  }
}

// 获取当前数据库
const loadCurrentDatabase = async () => {
  try {
    const response = await dbApi.getCurrentDatabase()
    if (response.success) {
      currentDatabase.value = response.result.database || 'default'
      // 更新本地存储
      dbApi.setCurrentDatabase(currentDatabase.value)
    }
  } catch (error) {
    console.error('获取当前数据库失败:', error)
  }
}

// 切换数据库
const handleDatabaseChange = async (database) => {
  if (database === currentDatabase.value) return

  try {
    if (database === 'default') {
      // 切换到默认数据库
      dbApi.setCurrentDatabase('default')
      currentDatabase.value = 'default'
      ElMessage.success('已切换到默认数据库')
      refreshTables()
      return
    }

    // 调用后端接口切换数据库
    const response = await dbApi.switchDatabase(database)
    if (response.success) {
      // 更新本地存储
      dbApi.setCurrentDatabase(database)
      currentDatabase.value = database
      ElMessage.success(response.message || '数据库切换成功')
      refreshTables()
    } else {
      ElMessage.error(response.message || '数据库切换失败')
    }
  } catch (error) {
    console.error('切换数据库失败:', error)
    ElMessage.error('切换数据库失败: ' + (error.message || error))
  }
}

// 添加数据库配置
const addDatabaseConfig = async () => {
  if (!databaseFormRef.value) return

  await databaseFormRef.value.validate(async (valid) => {
    if (!valid) return

    addingDatabase.value = true
    try {
      const config = {
        name: databaseForm.value.name,
        url: databaseForm.value.url,
        username: databaseForm.value.username,
        password: databaseForm.value.password,
        driverClassName: databaseForm.value.driverClassName,
        initialSize: 5,
        minIdle: 5,
        maxActive: 20
      }

      const response = await dbApi.addDatabaseConfig(config)
      if (response.success) {
        ElMessage.success('添加数据库配置成功')
        showAddDatabaseDialog.value = false
        // 重新加载数据库列表
        await loadDatabases()
        // 自动切换到新添加的数据库
        setTimeout(() => {
          selectedDatabase.value = config.name
          handleDatabaseChange(config.name)
        }, 500)
      }
    } catch (error) {
      console.error('添加数据库配置失败:', error)
      ElMessage.error('添加数据库配置失败: ' + (error.message || error))
    } finally {
      addingDatabase.value = false
    }
  })
}

// 重置数据库表单
const resetDatabaseForm = () => {
  databaseForm.value = {
    name: '',
    url: '',
    username: '',
    password: '',
    driverClassName: 'com.mysql.cj.jdbc.Driver'
  }
  if (databaseFormRef.value) {
    databaseFormRef.value.resetFields()
  }
}

const refreshTables = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await dbApi.getTables()
    console.log('获取表列表响应:', response)

    if (response.success) {
      tables.value = response.result || []
      tableKey.value += 1
      ElMessage.success(`表列表刷新成功 (共${tables.value.length}个表)`)
    } else {
      error.value = response.message || '获取表列表失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    console.error('获取表列表错误:', err)
    error.value = err.message || '获取表列表失败'
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
  tableStructure.value = []

  try {
    const response = await dbApi.getTableStructure(tableName)
    console.log('获取表结构响应:', response)

    if (response.success) {
      tableStructure.value = Array.isArray(response.result) ? response.result : []
      structureDialogVisible.value = true
    } else {
      tableStructureError.value = response.message || '获取表结构失败'
      ElMessage.error(tableStructureError.value)
      structureDialogVisible.value = true
    }
  } catch (err) {
    console.error('获取表结构错误:', err)
    tableStructureError.value = err.message || '获取表结构失败'
    ElMessage.error(tableStructureError.value)
    structureDialogVisible.value = true
  } finally {
    tableStructureLoading.value = false
  }
}

const handleDialogClosed = () => {
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

onMounted(async () => {
  // 先获取当前数据库
  await loadCurrentDatabase()
  // 加载数据库列表
  await loadDatabases()
  // 刷新表列表
  await refreshTables()
})
</script>

<style scoped>
.el-tag {
  cursor: pointer;
}

.el-select {
  flex-shrink: 0;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>