<template>
  <div>
    <h2 style="margin-bottom: 20px;">SQL查询编辑器</h2>

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
      </div>
    </div>

    <div v-if="loading" style="text-align: center; padding: 50px;">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>执行中...</p>
    </div>

    <div v-else-if="error" style="color: red; padding: 20px; background: #fef0f0; border-radius: 4px; margin-bottom: 20px;">
      {{ error }}
    </div>

    <div v-if="result">
      <div v-if="result.type === 'query'" style="margin-bottom: 20px;">
        <h3>查询结果 (共 {{ result.count || result.data?.length }} 条记录)</h3>
        <el-table :data="result.data" border style="width: 100%">
          <el-table-column
            v-for="column in columns"
            :key="column"
            :prop="column"
            :label="column"
          />
        </el-table>
      </div>

      <div v-else-if="result.type === 'update'">
        <el-alert
          title="执行成功"
          type="success"
          :description="`影响行数: ${result.rows}`"
          show-icon
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Delete, Collection, Loading } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const sql = ref('SELECT * FROM user LIMIT 10;')
const loading = ref(false)
const error = ref('')
const result = ref(null)
const columns = ref([])

const executeQuery = async () => {
  if (!sql.value.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }

  loading.value = true
  error.value = ''
  result.value = null
  columns.value = []

  try {
    // 调用API获取数据
    const apiResponse = await dbApi.executeQuery(sql.value)
    console.log('API返回数据:', apiResponse)

    // 从axios响应中提取数据
    const response = apiResponse.data || apiResponse

    // 根据你的后端数据结构，实际数据在 response.result 中
    if (response.success && response.result) {
      result.value = response.result

      if (response.result.type === 'query' && response.result.data && response.result.data.length > 0) {
        // 从第一条数据中提取列名
        columns.value = Object.keys(response.result.data[0])
      }

      ElMessage.success(response.msg || '查询执行成功')
    } else {
      error.value = response.msg || '查询失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    console.error('执行SQL错误:', err)
    error.value = err.response?.data?.message || err.message || '执行失败'
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
`
  ElMessage.info('已加载示例SQL')
}
</script>