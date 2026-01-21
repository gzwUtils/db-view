<template>
  <div>
    <h2 style="margin-bottom: 20px;">SQL查询编辑器</h2>

    <!-- 当前数据库显示 -->
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <span style="margin-right: 10px;">当前数据库:</span>
      <el-tag :type="currentDatabase === 'default' ? 'info' : 'primary'">
        {{ currentDatabase }}
      </el-tag>
      <el-button
        type="text"
        size="small"
        @click="refreshCurrentDatabase"
        :loading="refreshingDatabase"
        style="margin-left: 10px;"
      >
        <el-icon><Refresh /></el-icon>
      </el-button>
    </div>

    <div style="margin-bottom: 20px;">
      <el-input
        v-model="sql"
        type="textarea"
        :rows="8"
        placeholder="输入SQL语句，例如：SELECT * FROM user LIMIT 10"
        style="margin-bottom: 10px;"
      />

      <div style="display: flex; gap: 10px;">
        <el-button type="primary" @click="executeQuery" :loading="loading">
          <el-icon><VideoPlay /></el-icon>
          执行
        </el-button>
        <el-button @click="clearEditor">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
        <el-button @click="loadExample">
          <el-icon><Collection /></el-icon>
          示例
        </el-button>
        <el-button @click="explainQuery" :disabled="!sql.trim().startsWith('SELECT')">
          <el-icon><Search /></el-icon>
          解释
        </el-button>
      </div>
    </div>

    <div v-if="loading" style="text-align: center; padding: 50px;">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>执行中...</p>
    </div>

    <div v-else-if="error" style="color: red; padding: 20px; background: #fef0f0; border-radius: 4px; margin-bottom: 20px;">
      <p style="margin: 0; font-weight: bold;">错误信息:</p>
      <p style="margin: 5px 0 0 0;">{{ error }}</p>
    </div>

    <div v-if="result">
      <div v-if="result.type === 'query'" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3>查询结果 (共 {{ result.count || result.data?.length }} 条记录)</h3>
          <div style="font-size: 14px; color: #666;">
            执行时间: {{ executionTime }}ms
          </div>
        </div>

        <el-table :data="result.data" border style="width: 100%" v-if="result.data && result.data.length > 0">
          <el-table-column
            v-for="(column, index) in columns"
            :key="index"
            :prop="column"
            :label="column"
            :show-overflow-tooltip="true"
          />
        </el-table>

        <div v-else style="text-align: center; padding: 20px; color: #999;">
          查询结果为空
        </div>
      </div>

      <div v-else-if="result.type === 'update'">
        <el-alert
          title="执行成功"
          type="success"
          :description="`影响行数: ${result.rows}`"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 查询解释结果 -->
      <div v-if="explainResult" style="margin-top: 20px;">
        <h3>查询解释</h3>
        <el-table :data="explainResult" border style="width: 100%">
          <el-table-column
            v-for="column in explainColumns"
            :key="column"
            :prop="column"
            :label="column"
            :show-overflow-tooltip="true"
          />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Delete, Collection, Loading, Refresh, Search } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const sql = ref('SELECT * FROM user LIMIT 10;')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const columns = ref([])
const currentDatabase = ref('default')
const refreshingDatabase = ref(false)
const executionTime = ref(0)
const explainResult = ref(null)
const explainColumns = ref([])

// 获取当前数据库
const loadCurrentDatabase = async () => {
  try {
    const response = await dbApi.getCurrentDatabase()
    if (response.success) {
      currentDatabase.value = response.result.database || 'default'
    }
  } catch (error) {
    console.error('获取当前数据库失败:', error)
  }
}

// 刷新当前数据库
const refreshCurrentDatabase = async () => {
  refreshingDatabase.value = true
  await loadCurrentDatabase()
  refreshingDatabase.value = false
  ElMessage.success('当前数据库已刷新')
}

// 执行查询解释
const explainQuery = async () => {
  if (!sql.value.trim().toUpperCase().startsWith('SELECT')) {
    ElMessage.warning('仅支持SELECT语句的解释')
    return
  }

  const explainSql = `EXPLAIN ${sql.value}`
  const originalSql = sql.value
  sql.value = explainSql

  try {
    await executeQuery()
  } finally {
    sql.value = originalSql
  }
}

const executeQuery = async () => {
  if (!sql.value.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }

  loading.value = true
  error.value = ''
  result.value = null
  columns.value = []
  explainResult.value = null
  explainColumns.value = []
  const startTime = Date.now()

  try {
    const response = await dbApi.executeQuery(sql.value)
    console.log('API返回数据:', response)

    if (response.success) {
      result.value = response.result || response.data
      executionTime.value = Date.now() - startTime

      if (result.value.type === 'query' && result.value.data && result.value.data.length > 0) {
        // 从第一条数据中提取列名
        columns.value = Object.keys(result.value.data[0])

        // 检查是否为EXPLAIN结果
        if (sql.value.trim().toUpperCase().startsWith('EXPLAIN')) {
          explainResult.value = result.value.data
          explainColumns.value = columns.value
          result.value = null // 不显示为普通查询结果
        }
      }

      ElMessage.success(response.message || '查询执行成功')
    } else {
      error.value = response.message || '查询失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    console.error('执行SQL错误:', err)
    error.value = err.message || '执行失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const clearEditor = () => {
  sql.value = ''
  result.value = null
  error.value = ''
  columns.value = []
  explainResult.value = null
  explainColumns.value = []
}

const loadExample = () => {
  sql.value = `-- 示例查询
-- 1. 查看所有表
SHOW TABLES;

-- 2. 查看用户表数据
SELECT * FROM user LIMIT 10;

-- 3. 统计数据
SELECT
  status,
  COUNT(*) as count,
  AVG(age) as avg_age
FROM user
GROUP BY status
ORDER BY count DESC;

-- 4. 创建测试表
CREATE TABLE IF NOT EXISTS test_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 插入数据
INSERT INTO test_table (name) VALUES ('测试1'), ('测试2');

-- 6. 更新数据
UPDATE test_table SET name = '更新测试' WHERE id = 1;

-- 7. 删除数据
DELETE FROM test_table WHERE id = 2;

-- 8. 查看索引
SHOW INDEX FROM user;

-- 9. 查看进程列表
SHOW PROCESSLIST;`
  ElMessage.info('已加载示例SQL')
}

onMounted(() => {
  loadCurrentDatabase()
})
</script>

<style scoped>
.el-textarea :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.el-table {
  margin-top: 10px;
}

.el-alert {
  margin-top: 10px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: bold;
}
</style>