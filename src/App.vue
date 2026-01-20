<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <el-header style="background: #409eff; color: white; display: flex; align-items: center;">
        <h2 style="margin: 0;">数据库管理系统</h2>
        <div style="margin-left: auto;">
          <el-button type="text" style="color: white;" @click="logout">退出</el-button>
        </div>
      </el-header>

      <el-container>
        <el-aside width="200px" style="background: #fff;">
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
          </el-menu>
        </el-aside>

        <el-main style="padding: 20px;">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Grid, EditPen, PieChart } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)

const handleMenuSelect = (index) => {
  console.log('菜单选择:', index)
}

const logout = () => {
  if (confirm('确定要退出吗？')) {
    location.reload()
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
}

#app {
  height: 100vh;
}
</style>