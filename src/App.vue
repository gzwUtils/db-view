<template>
  <div id="app">
    <!-- 登录页面不显示布局 -->
    <template v-if="$route.path === '/login'">
      <router-view />
    </template>

    <!-- 其他页面显示完整布局 -->
    <template v-else>
      <el-container style="height: 100vh;">
        <el-header style="background: #409eff; color: white; display: flex; align-items: center;">
          <h2 style="margin: 0;">数据库管理系统</h2>
          <div style="margin-left: auto; display: flex; align-items: center;">
            <span style="margin-right: 20px;">欢迎, {{ username }}</span>
            <el-button type="text" style="color: white;" @click="logout">退出</el-button>
          </div>
        </el-header>

        <el-container>
          <el-aside width="200px" style="background: #fff; border-right: 1px solid #e6e6e6;">
            <el-menu
              :default-active="activeMenu"
              router
              @select="handleMenuSelect"
            >
              <el-menu-item index="/tables">
                <el-icon><Grid /></el-icon>
                <span>数据表</span>
              </el-menu-item>
              <el-menu-item index="/query">
                <el-icon><EditPen /></el-icon>
                <span>SQL查询</span>
              </el-menu-item>
              <el-menu-item index="/charts">
                <el-icon><PieChart /></el-icon>
                <span>图表分析</span>
              </el-menu-item>
              <el-menu-item index="/export">
                <el-icon><Upload /></el-icon>
                <span>导入导出</span>
              </el-menu-item>
              <el-menu-item index="/history">
                <el-icon><Histogram /></el-icon>
                <span>历史记录</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <el-main style="padding: 20px; background: #f5f7fa;">
            <router-view />
          </el-main>
        </el-container>
      </el-container>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Grid, EditPen, PieChart, Upload, Histogram } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 数据
const activeMenu = computed(() => route.path)
const username = ref('')

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('token')

  console.log('检查登录状态，token:', token)

  if (!token) {
    console.log('没有token，跳转到登录页')
    router.replace('/login')
    return false
  }

  // 设置用户名
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      username.value = user.username || user.name || '用户'
    } catch (e) {
      console.error('解析用户信息失败:', e)
    }
  }

  return true
}

// 监听路由变化
watch(() => route.path, (newPath) => {
  console.log('路由变化到:', newPath)
  if (newPath !== '/login') {
    checkLoginStatus()
  }
})

// 生命周期钩子
onMounted(() => {
  console.log('App.vue mounted，当前路由:', route.path)
  if (route.path !== '/login') {
    checkLoginStatus()
  }
})

// 菜单选择处理
const handleMenuSelect = (index) => {
  console.log('菜单选择:', index)
}

// 退出登录
const logout = () => {
  if (confirm('确定要退出吗？')) {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    username.value = ''
    router.replace('/login')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
  background-color: #f5f7fa;
}

#app {
  height: 100vh;
}

/* 美化侧边栏菜单 */
.el-menu {
  border-right: none;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 5px 0;
}

.el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
  border-right: 3px solid #409eff;
}

/* 主内容区域滚动条 */
.el-main {
  overflow-y: auto;
}

/* 顶部栏样式 */
.el-header {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}
</style>