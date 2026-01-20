import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 封装API请求
export const dbApi = {
  // 获取所有表
  getTables() {
    return api.get('/tables')
  },

  // 获取表结构
  getTableStructure(tableName) {
    return api.get(`/table/${tableName}/structure`)
  },

  // 获取表数据
  getTableData(tableName, params) {
    return api.get(`/table/${tableName}/data`, { params })
  },

  // 执行SQL查询
  executeQuery(sql) {
    return api.post('/query', { sql })
  },

  // 获取图表数据
  getChartData(data) {
    return api.post('/chart', data)
  },

  // 获取数据库统计
  getDatabaseStats() {
    return api.get('/stats')
  },

  // 获取图表示例
  getChartExamples() {
    return api.get('/chart/examples')
  }
}