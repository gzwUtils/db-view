import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3801,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:20006',
        changeOrigin: true
      }
    }
  }
})