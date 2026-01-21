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
        <el-button @click="explainQuery" :disabled="!isSelectQuery">
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

    <!-- 查询结果 -->
    <div v-if="result" style="margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3>{{ resultTitle }}</h3>
        <div style="font-size: 14px; color: #666;">
          执行时间: {{ executionTime }}ms
        </div>
      </div>

      <!-- 查询数据表格 -->
      <div v-if="result.data && result.data.length > 0">
        <el-table :data="result.data" border style="width: 100%">
          <el-table-column
            v-for="(column, index) in columns"
            :key="index"
            :prop="column"
            :label="column"
            :show-overflow-tooltip="true"
          />
        </el-table>
      </div>

      <!-- 影响行数显示 -->
      <div v-else-if="result.rows !== undefined">
        <el-alert
          title="执行成功"
          type="success"
          :description="`影响行数: ${result.rows}`"
          show-icon
          :closable="false"
        />
      </div>

      <!-- 空结果 -->
      <div v-else-if="result.data && result.data.length === 0" style="text-align: center; padding: 20px; color: #999;">
        查询结果为空
      </div>

      <!-- 纯消息显示 -->
      <div v-else-if="result.message">
        <el-alert
          title="执行成功"
          type="success"
          :description="result.message"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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

// 计算属性：判断是否是SELECT查询
const isSelectQuery = computed(() => {
  return sql.value.trim().toUpperCase().startsWith('SELECT')
})

// 计算属性：结果标题
const resultTitle = computed(() => {
  if (!result.value) return '查询结果'

  if (result.value.data && result.value.data.length > 0) {
    return `查询结果 (共 ${result.value.count || result.value.data.length} 条记录)`
  } else if (result.value.rows !== undefined) {
    return '执行结果'
  }
  return '执行结果'
})

// 获取当前数据库
const loadCurrentDatabase = async () => {
  try {
    const response = await dbApi.getCurrentDatabase()
    if (response.success) {
      currentDatabase.value = response.result.database || response.result || 'default'
    }
  } catch (err) {
    console.error('获取当前数据库失败:', err)
    ElMessage.warning('获取当前数据库失败')
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
  const sqlText = sql.value.trim()

  if (!isSelectQuery.value) {
    ElMessage.warning('仅支持SELECT语句的解释')
    return
  }

  // 临时保存原始SQL
  const originalSql = sqlText

  // 构建EXPLAIN SQL
  sql.value = `EXPLAIN ${sqlText}`

  // 执行查询
  await executeQuery()

  // 恢复原始SQL
  setTimeout(() => {
    sql.value = originalSql
  }, 100)
}

// 执行查询
const executeQuery = async () => {
  if (!sql.value.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }

  loading.value = true
  error.value = ''
  result.value = null
  columns.value = []
  const startTime = Date.now()

  try {
    console.log('执行SQL:', sql.value)
    const response = await dbApi.executeQuery(sql.value)
    console.log('API返回数据:', response)

    if (response.success) {
      result.value = response.result || response.data
      executionTime.value = Date.now() - startTime

      // 如果有查询数据，提取列名
      if (result.value.data && result.value.data.length > 0) {
        columns.value = Object.keys(result.value.data[0])
      }

      ElMessage.success(response.message || '执行成功')
    } else {
      error.value = response.message || '执行失败'
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

// 清空编辑器
const clearEditor = () => {
  sql.value = ''
  result.value = null
  error.value = ''
  columns.value = []
}

// 加载示例
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
SHOW PROCESSLIST;

-- 10. 复杂的JOIN查询
SELECT
  u.id,
  u.username,
  u.email,
  COUNT(o.id) as order_count,
  SUM(o.amount) as total_amount
FROM user u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id
HAVING order_count > 0
ORDER BY total_amount DESC
LIMIT 10;`
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
  line-height: 1.5;
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

:deep(.el-table .cell) {
  line-height: 1.6;
  padding: 8px 10px;
}

:deep(.el-table--border) {
  border: 1px solid #ebeef5;
}

:deep(.el-table--border th) {
  border-right: 1px solid #ebeef5;
}

:deep(.el-table--border td) {
  border-right: 1px solid #ebeef5;
}
</style>