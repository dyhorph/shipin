# Gemini 视频分析应用

这是一个纯前端的 Vue 应用，用于上传视频并使用 Gemini API 进行分析。

## 功能特点

- 上传视频文件（最大支持 2GB）
- 显示上传进度
- 发送提示文本给 Gemini API
- 展示 AI 回复
- 支持持续对话
- 本地存储视频和对话历史

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Element Plus
- Vite

## 使用方法

1. 输入您的 Gemini API Key
2. 上传视频文件
3. 输入提示文本并发送
4. 查看 AI 回复
5. 继续对话

## 注意事项

- API Key 仅存储在本地浏览器中，不会发送到任何第三方服务器
- 视频文件暂存在浏览器本地，不会上传到除 Google Gemini API 以外的任何服务器
- 视频文件在 Gemini API 中存储 48 小时后将自动删除 