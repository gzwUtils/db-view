import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'

// 导入视图组件
import TableList from './views/TableList.vue'
import SqlQuery from './views/SqlQuery.vue'
import ChartBuilder from './views/ChartBuilder.vue'

// 创建路由
const routes = [
  { path: '/', redirect: '/tables' },
  { path: '/tables', component: TableList },
  { path: '/query', component: SqlQuery },
  { path: '/charts', component: ChartBuilder }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

app.mount('#app')