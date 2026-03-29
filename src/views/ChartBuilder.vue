<template>
  <div>
    <h2 style="margin-bottom: 20px;">图表分析</h2>

    <!-- 当前数据库显示 -->
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
      <span style="margin-right: 10px;">当前数据库:</span>
      <el-tag :type="currentDatabase === 'default' ? 'info' : 'primary'">
        {{ currentDatabase }}
      </el-tag>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card style="height: 100%;">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
              <span>图表配置</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <el-select
                  v-model="selectedTemplateId"
                  placeholder="选择模板"
                  size="small"
                  style="width: 200px;"
                  :loading="loadingTemplates"
                  @change="handleTemplateChange"
                  clearable
                >
                  <el-option
                    v-for="tpl in reportTemplates"
                    :key="tpl.id"
                    :label="tpl.name"
                    :value="tpl.id"
                  />
                </el-select>
                <el-button size="small" @click="openSaveTemplateDialog">保存模板</el-button>
                <el-button
                  size="small"
                  type="danger"
                  :disabled="!selectedTemplateId"
                  @click="deleteSelectedTemplate"
                >删除</el-button>
              </div>
            </div>
          </template>

          <el-form :model="chartForm" label-width="80px">
            <el-form-item label="图表类型">
              <el-select v-model="chartForm.type" placeholder="选择图表类型">
                <el-option label="柱状图" value="bar" />
                <el-option label="折线图" value="line" />
                <el-option label="饼图" value="pie" />
                <el-option label="散点图" value="scatter" />
              </el-select>
            </el-form-item>

            <el-form-item label="标题">
              <el-input v-model="chartForm.title" placeholder="图表标题" />
            </el-form-item>

            <el-form-item label="SQL查询">
              <el-input
                v-model="chartForm.sql"
                type="textarea"
                :rows="6"
                placeholder="输入SQL查询，结果应该包含类别和数据列"
              />
              <div style="font-size: 12px; color: #666; margin-top: 5px;">
                提示：查询应返回两列，第一列为类别，第二列为数值
              </div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="generateChart" :loading="loading">
                <el-icon><MagicStick /></el-icon>
                生成图表
              </el-button>
              <el-button @click="loadExample">
                <el-icon><Collection /></el-icon>
                示例
              </el-button>
              <el-button @click="loadChartExamples" :loading="loadingExamples">
                <el-icon><DataLine /></el-icon>
                更多示例
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card style="height: 100%;">
          <template #header>
            <span>图表预览</span>
          </template>

          <div v-if="loading" style="text-align: center; padding: 50px;">
            <el-icon class="is-loading" size="32"><Loading /></el-icon>
            <p>生成中...</p>
          </div>

          <div v-else-if="error" style="color: red; padding: 20px; background: #fef0f0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold;">错误信息:</p>
            <p style="margin: 5px 0 0 0;">{{ error }}</p>
          </div>

          <div v-else-if="chartResult" style="text-align: center;">
            <h3>{{ chartTitle }}</h3>
            <div style="height: 400px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 4px;">
              <!-- 柱状图 -->
              <div v-if="chartResult.type === 'bar' && barChartData" class="chart-container">
                <div style="display: flex; align-items: flex-end; justify-content: center; height: 300px; gap: 20px;">
                  <div v-for="(value, index) in barChartData.series[0].data" :key="index" style="display: flex; flex-direction: column; align-items: center;">
                    <div
                      :style="{
                        width: '40px',
                        height: value / maxBarValue * 250 + 'px',
                        background: colors[index % colors.length],
                        borderRadius: '4px'
                      }"
                    />
                    <div style="margin-top: 10px; font-size: 12px;">
                      {{ barChartData.xAxis && barChartData.xAxis[index] ? barChartData.xAxis[index] : `项目${index + 1}` }}
                    </div>
                    <div style="font-size: 12px; color: #666;">{{ value }}</div>
                  </div>
                </div>
              </div>

              <!-- 饼图 -->
              <div v-else-if="chartResult.type === 'pie' && pieChartData" class="chart-container">
                <div style="position: relative; width: 300px; height: 300px;">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    {{ totalPieValue }}
                  </div>
                  <div
                    v-for="(item, index) in pieChartData"
                    :key="index"
                    :style="{
                      position: 'absolute',
                      width: '300px',
                      height: '300px',
                      borderRadius: '50%',
                      clipPath: getPieClipPath(index),
                      background: colors[index % colors.length]
                    }"
                  />
                </div>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 20px; gap: 10px;">
                  <div v-for="(item, index) in pieChartData" :key="index" style="display: flex; align-items: center;">
                    <div :style="{ width: '12px', height: '12px', background: colors[index % colors.length], marginRight: '5px' }"></div>
                    <span style="font-size: 12px;">{{ item.name }}: {{ item.value }}</span>
                  </div>
                </div>
              </div>

              <!-- 折线图 -->
              <div v-else-if="chartResult.type === 'line' && lineChartData" class="chart-container">
                <svg width="400" height="300" style="overflow: visible;">
                  <polyline
                    :points="linePoints"
                    fill="none"
                    stroke="#409eff"
                    stroke-width="2"
                  />
                  <circle
                    v-for="(point, index) in linePointsArray"
                    :key="index"
                    :cx="point.x"
                    :cy="point.y"
                    r="4"
                    fill="#409eff"
                  />
                </svg>
              </div>

              <!-- 散点图 -->
              <div v-else-if="chartResult.type === 'scatter'" class="chart-container">
                <div v-if="chartResult.chartData && chartResult.chartData.length > 0">
                  <!-- 如果有散点图数据，可以在这里渲染 -->
                  <el-empty description="散点图数据格式待实现" />
                </div>
                <div v-else-if="chartResult.rawData && chartResult.rawData.length > 0" style="height: 300px; display: flex; align-items: center; justify-content: center;">
                  <div>
                    <p>原始数据 (共 {{ chartResult.rawData.length }} 条记录):</p>
                    <div style="max-height: 200px; overflow-y: auto; text-align: left;">
                      <pre style="font-size: 12px;">{{ JSON.stringify(chartResult.rawData, null, 2) }}</pre>
                    </div>
                  </div>
                </div>
                <div v-else>
                  <el-empty description="暂无散点图数据" />
                </div>
              </div>

              <!-- 其他情况 -->
              <div v-else class="chart-container">
                <el-empty description="请选择图表类型并生成图表" />
              </div>
            </div>

            <div v-if="chartResult" style="margin-top: 20px; font-size: 12px; color: #666;">
              <p>图表类型: {{ chartResult.type }}</p>
              <p v-if="chartResult.rawData">数据量: {{ chartResult.rawData.length }} 条记录</p>
            </div>
          </div>

          <div v-else style="text-align: center; padding: 50px;">
            <el-empty description="暂无图表数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表示例对话框 -->
    <el-dialog
      v-model="showExamplesDialog"
      title="图表示例"
      width="600px"
    >
      <div v-if="loadingExamples" style="text-align: center; padding: 20px;">
        <el-icon class="is-loading"><Loading /></el-icon>
        加载中...
      </div>
      <div v-else-if="chartExamples.length > 0">
        <el-table :data="chartExamples" style="width: 100%" @row-click="loadExampleFromList">
          <el-table-column prop="title" label="示例标题" width="150" />
          <el-table-column prop="sql" label="SQL语句" show-overflow-tooltip />
          <el-table-column prop="type" label="图表类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getChartTypeTag(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" width="120" />
        </el-table>
      </div>
      <div v-else style="text-align: center; padding: 20px;">
        <el-empty description="暂无示例" />
      </div>
    </el-dialog>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="showSaveTemplateDialog"
      title="保存为模板"
      width="520px"
    >
      <el-form :model="templateForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选：模板用途说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveTemplateDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingTemplate" @click="saveTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, Collection, Loading, DataLine } from '@element-plus/icons-vue'
import { dbApi } from '../api'

const chartForm = ref({
  type: 'bar',
  title: '数据统计图表',
  sql: 'SELECT status, COUNT(*) as count FROM user GROUP BY status'
})

const loading = ref(false)
const error = ref('')
const chartResult = ref(null)
const chartTitle = ref('')
const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#e4393c', '#ffd700', '#9acd32']
const currentDatabase = ref('default')
const chartExamples = ref([])
const showExamplesDialog = ref(false)
const loadingExamples = ref(false)

// 模板相关（个性化报表）
const reportTemplates = ref([])
const selectedTemplateId = ref(null)
const loadingTemplates = ref(false)
const showSaveTemplateDialog = ref(false)
const savingTemplate = ref(false)
const templateForm = ref({ name: '', description: '' })

// 计算属性，用于提取不同类型图表的数据
const barChartData = computed(() => {
  if (!chartResult.value || chartResult.value.type !== 'bar') return null
  return chartResult.value.chartData || null
})

const pieChartData = computed(() => {
  if (!chartResult.value || chartResult.value.type !== 'pie') return null
  return chartResult.value.chartData || null
})

const lineChartData = computed(() => {
  if (!chartResult.value || chartResult.value.type !== 'line') return null
  return chartResult.value.chartData || null
})

// 计算属性，用于渲染
const maxBarValue = computed(() => {
  if (!barChartData.value || !barChartData.value.series || !barChartData.value.series[0].data) return 0
  return Math.max(...barChartData.value.series[0].data)
})

const totalPieValue = computed(() => {
  if (!pieChartData.value || !pieChartData.value.length) return 0
  return pieChartData.value.reduce((sum, item) => sum + (item.value || 0), 0)
})

const linePoints = computed(() => {
  if (!lineChartData.value || !lineChartData.value.series || !lineChartData.value.series[0].data || lineChartData.value.series[0].data.length < 2) return ''

  const data = lineChartData.value.series[0].data
  const maxVal = Math.max(...data)
  const points = data.map((value, index) => {
    const x = 50 + (index * (300 / (data.length - 1)))
    const y = 250 - (value / maxVal * 200)
    return `${x},${y}`
  })
  return points.join(' ')
})

const linePointsArray = computed(() => {
  if (!lineChartData.value || !lineChartData.value.series || !lineChartData.value.series[0].data || lineChartData.value.series[0].data.length < 2) return []

  const data = lineChartData.value.series[0].data
  const maxVal = Math.max(...data)
  return data.map((value, index) => {
    const x = 50 + (index * (300 / (data.length - 1)))
    const y = 250 - (value / maxVal * 200)
    return { x, y }
  })
})

const getPieClipPath = (index) => {
  if (!pieChartData.value || !pieChartData.value.length) return ''

  let startAngle = 0
  const data = pieChartData.value

  for (let i = 0; i < index; i++) {
    startAngle += (data[i].value / totalPieValue.value) * 360
  }

  const angle = (data[index].value / totalPieValue.value) * 360

  const startRad = (startAngle - 90) * Math.PI / 180
  const endRad = (startAngle + angle - 90) * Math.PI / 180

  const x1 = 150 + 150 * Math.cos(startRad)
  const y1 = 150 + 150 * Math.sin(startRad)
  const x2 = 150 + 150 * Math.cos(endRad)
  const y2 = 150 + 150 * Math.sin(endRad)

  const largeArc = angle > 180 ? 1 : 0

  return `path('M 150,150 L ${x1},${y1} A 150,150 0 ${largeArc},1 ${x2},${y2} Z')`
}

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

const generateChart = async () => {
  if (!chartForm.value.sql.trim()) {
    ElMessage.warning('请输入SQL查询语句')
    return
  }

  loading.value = true
  error.value = ''
  chartResult.value = null
  chartTitle.value = chartForm.value.title

  try {
    const response = await dbApi.getChartData({
      sql: chartForm.value.sql,
      chartType: chartForm.value.type,
      title: chartForm.value.title
    })

    console.log('图表API返回数据:', response)

    if (response.success) {
      chartResult.value = response.result || response.data

      if (chartResult.value) {
        ElMessage.success('图表生成成功')
      } else {
        ElMessage.warning('查询结果为空')
      }
    } else {
      error.value = response.message || '生成图表失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    console.error('生成图表错误:', err)
    error.value = err.message || '生成图表失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const loadExample = () => {
  chartForm.value = {
    type: 'bar',
    title: '用户状态统计',
    sql: `SELECT
  status,
  COUNT(*) as count
FROM users
GROUP BY status
ORDER BY count DESC`
  }
  ElMessage.info('已加载示例配置')
}

// 加载图表示例
const loadChartExamples = async () => {
  loadingExamples.value = true
  showExamplesDialog.value = true

  try {
    const response = await dbApi.getChartExamples()
    if (response.success) {
      chartExamples.value = response.result || []
    }
  } catch (error) {
    console.error('加载图表示例失败:', error)
    ElMessage.error('加载图表示例失败')
  } finally {
    loadingExamples.value = false
  }
}

// 从示例列表加载
const loadExampleFromList = (row) => {
  chartForm.value = {
    type: row.type,
    title: row.title,
    sql: row.sql
  }
  showExamplesDialog.value = false
  ElMessage.success(`已加载示例: ${row.title}`)
}

// 获取图表类型标签样式
const getChartTypeTag = (type) => {
  switch (type) {
    case 'bar': return 'primary'
    case 'line': return 'success'
    case 'pie': return 'warning'
    case 'scatter': return 'danger'
    default: return 'info'
  }
}

const loadReportTemplates = async () => {
  loadingTemplates.value = true
  try {
    const response = await dbApi.listReportTemplates({ page: 1, size: 100 })
    if (response.success) {
      const page = response.result
      reportTemplates.value = page?.data || []
    }
  } catch (e) {
    console.error('加载模板失败:', e)
  } finally {
    loadingTemplates.value = false
  }
}

const handleTemplateChange = (id) => {
  if (!id) return
  const tpl = reportTemplates.value.find(t => t.id === id)
  if (!tpl) return

  chartForm.value = {
    type: tpl.chartType,
    title: tpl.title || tpl.name,
    sql: tpl.sqlText
  }
  ElMessage.success(`已加载模板: ${tpl.name}`)
}

const openSaveTemplateDialog = () => {
  templateForm.value = {
    name: chartForm.value.title || '未命名模板',
    description: ''
  }
  showSaveTemplateDialog.value = true
}

const saveTemplate = async () => {
  if (!templateForm.value.name?.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (!chartForm.value.sql?.trim()) {
    ElMessage.warning('请先填写SQL')
    return
  }

  savingTemplate.value = true
  try {
    const response = await dbApi.createReportTemplate({
      name: templateForm.value.name,
      title: chartForm.value.title,
      chartType: chartForm.value.type,
      sqlText: chartForm.value.sql,
      description: templateForm.value.description,
      isPublic: false
    })

    if (response.success) {
      ElMessage.success('模板保存成功')
      showSaveTemplateDialog.value = false
      await loadReportTemplates()
      selectedTemplateId.value = response.result?.id || null
    } else {
      ElMessage.error(response.message || '模板保存失败')
    }
  } catch (e) {
    console.error('保存模板失败:', e)
    ElMessage.error(e.message || '模板保存失败')
  } finally {
    savingTemplate.value = false
  }
}

const deleteSelectedTemplate = async () => {
  if (!selectedTemplateId.value) return
  const tpl = reportTemplates.value.find(t => t.id === selectedTemplateId.value)

  try {
    await ElMessageBox.confirm(
      `确定删除模板“${tpl?.name || selectedTemplateId.value}”吗？`,
      '删除确认',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }

  try {
    const response = await dbApi.deleteReportTemplate(selectedTemplateId.value)
    if (response.success) {
      ElMessage.success('删除成功')
      selectedTemplateId.value = null
      await loadReportTemplates()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (e) {
    console.error('删除模板失败:', e)
    ElMessage.error(e.message || '删除失败')
  }
}

onMounted(() => {
  loadCurrentDatabase()
  loadReportTemplates()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-width: 100%;
  overflow-x: auto;
}

.el-table {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
