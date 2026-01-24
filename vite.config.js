import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3801,
    proxy: {
      '/api': {
        target: 'http://101.42.236.45:20006',
        changeOrigin: true
      }
    }
  }
})