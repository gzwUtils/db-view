import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器 - 添加token和数据库头信息
api.interceptors.request.use(config => {
  // 添加token
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // 从sessionStorage获取当前数据库（使用sessionStorage保证会话期间有效）
  const currentDatabase = sessionStorage.getItem('currentDatabase') || 'default'

  // 添加数据库头
  config.headers['X-Database'] = currentDatabase

  // 对于需要数据库参数的请求，添加database参数
  if (config.data && typeof config.data === 'object' && !config.data.database) {
    config.data.database = currentDatabase
  }

  // 显示请求日志
  console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
    database: currentDatabase,
    data: config.data || config.params
  })

  return config
}, error => {
  console.error('请求拦截器错误:', error)
  return Promise.reject(error)
})

// 响应拦截器 - 统一处理响应
api.interceptors.response.use(
  response => {
    const data = response.data

    // 统一处理返回结构
    if (data && typeof data === 'object') {
      // 后端返回的是ApiOutput格式
      if (data.code === 200 || data.success === true) {
        return {
          success: true,
          result: data.result || data.data,
          message: data.message || data.msg,
          ...data
        }
      } else {
        // 返回错误
        const error = new Error(data.message || data.msg || '请求失败')
        error.code = data.code
        error.success = false
        return Promise.reject(error)
      }
    }

    return data
  },
  error => {
    console.error('API响应错误:', error)

    let message = '请求失败'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          message = data?.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // token过期，清除本地存储并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = data?.message || '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        default:
          message = `请求错误: ${status}`
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    } else {
      message = error.message || '请求配置错误'
    }

    // 显示错误提示
    ElMessage.error(message)

    return Promise.reject({
      success: false,
      message,
      error: error
    })
  }
)

// 封装API请求
export const dbApi = {
  // 认证相关
  // 获取验证码
  getCaptcha() {
    return api.get('/auth/captcha')
  },

  // 登录
  login(data) {
    return api.post('/auth/login', data)
  },

  // 验证token
  validateToken(token) {
      return api.post('/auth/validate-token', {  // 使用请求体
          token: token
      })
  },

  refreshToken(token) {
    return api.post('/auth/refresh-token', {
          token: token
    })
  },
  // 登出
  logout() {
    return api.post('/auth/logout')
  },

  // 获取账户状态
  getAccountStatus(username) {
    return api.get('/auth/account/status', { params: { username } })
  },

  // 解锁账户
  unlockAccount(username) {
    return api.post('/auth/account/unlock', null, { params: { username } })
  },

  // 数据库相关
  // 获取所有数据库
  getDatabases() {
    return api.get('/databases')
  },

  // 获取当前数据库
  getCurrentDatabase() {
    return api.get('/database/current')
  },

  // 切换到指定数据库
  switchDatabase(database) {
    return api.post('/database/switch', { database })
  },

  // 添加数据库配置
  addDatabaseConfig(config) {
    return api.post('/database/config', config)
  },

  // 获取数据库配置
  getDatabaseConfigs() {
    return api.get('/database/configs')
  },

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
  },

  // 设置当前数据库（前端本地设置）
  setCurrentDatabase(database) {
    sessionStorage.setItem('currentDatabase', database)
    console.log(`当前数据库已设置为: ${database}`)
  },

  // 获取当前数据库（前端本地获取）
  getCurrentDatabaseLocal() {
    return sessionStorage.getItem('currentDatabase') || 'default'
  },

  // 数据导出
  exportData(data) {
    return api.post('/data/export', data, { responseType: 'blob' })
  },

  // CSV导入
  importCsv(data) {
    return api.post('/data/import/csv', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Excel导入
  importExcel(data) {
    return api.post('/data/import/excel', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // SQL导入
  importSql(data) {
    return api.post('/data/import/sql', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 获取SQL历史记录
  getSqlHistory(params) {
    return api.get('/data/history/sql', { params })
  },

  // 获取操作日志
  getOperationLogs(params) {
    return api.get('/data/history/operation', { params })
  },

  // 清空SQL历史记录
  clearSqlHistory(database) {
    return api.delete('/data/history/sql', { params: { database } })
  },

  // 清空操作日志
  clearOperationLogs(database) {
    return api.delete('/data/history/operation', { params: { database } })
  },

  // 下载模板
  downloadTemplate(tableName) {
    return api.get(`/data/template?tableName=${tableName}`, { responseType: 'blob' })
  }
}

export default api