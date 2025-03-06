import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // 使用esbuild作为压缩工具（Vite默认）
    minify: 'esbuild',
    // esbuild配置
    target: 'es2015',
    // 移除console和debugger
    cssTarget: 'chrome80',
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vendor': ['vue', '@google/generative-ai']
        }
      }
    }
  }
}) 