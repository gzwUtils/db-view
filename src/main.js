// main.js
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from './api/index'

import App from './App.vue'

// 导入视图组件
import TableList from './views/TableList.vue'
import SqlQuery from './views/SqlQuery.vue'
import ChartBuilder from './views/ChartBuilder.vue'
import HistoryLog from './views/HistoryLog.vue'
import ImportExport from './views/ImportExport.vue'
import Login from './views/Login.vue'

// 创建路由
const routes = [
  {
    path: '/',
    redirect: '/tables'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/tables',
    component: TableList
  },
  {
    path: '/query',
    component: SqlQuery
  },
  {
    path: '/charts',
    component: ChartBuilder
  },
  {
    path: '/history',
    component: HistoryLog
  },
  {
    path: '/export',
    component: ImportExport
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简化的路由守卫 - 只做基础路由控制
router.beforeEach((to, from, next) => {
  console.log('路由守卫: 从', from.path, '到', to.path)

  // 访问登录页的特殊处理
  if (to.path === '/login') {
    // 如果已经有token，直接跳转到主页
    const token = localStorage.getItem('token')
    if (token) {
      next('/tables')
    } else {
      next()
    }
  } else {
    // 其他页面直接放行，由App.vue处理验证
    next()
  }
})

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

// 全局挂载axios
app.config.globalProperties.$axios = axios

app.mount('#app')