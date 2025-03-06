import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/', // 确保基础路径正确
  build: {
    // 使用esbuild作为压缩工具（Vite默认）
    minify: 'esbuild',
    // esbuild配置
    target: 'es2015',
    // 移除console和debugger
    cssTarget: 'chrome80'
  }
}) 