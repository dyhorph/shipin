<template>
  <div class="app-container">
    <el-config-provider :locale="zhCn">
      <el-card class="app-card">
        <template #header>
          <div class="app-header">
            <h2>七维特教视频分析应用</h2>
            <el-button type="danger" @click="clearAll" size="small">
              清空所有数据
            </el-button>
          </div>
        </template>
        
        <!-- 视频上传 -->
        <VideoUploader 
          :api-key="apiKey" 
          @upload-complete="handleUploadComplete"
          @video-removed="handleVideoRemoved"
        />
        
        <!-- 聊天界面 -->
        <ChatInterface 
          ref="chatInterfaceRef"
          :api-key="apiKey"
          :video-file="videoFile"
        />
      </el-card>
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import VideoUploader from './components/VideoUploader.vue';
import ChatInterface from './components/ChatInterface.vue';
import { clearChatHistory, getApiKey } from './services/storageService';

const chatInterfaceRef = ref<InstanceType<typeof ChatInterface> | null>(null);

const videoFile = ref<File | null>(null);

// 直接获取默认 API Key
const apiKey = computed(() => {
  return getApiKey();
});

// 处理视频上传完成
const handleUploadComplete = (data: { file: File }) => {
  videoFile.value = data.file;
  ElMessage.success('视频已准备就绪，可以开始对话');
};

// 处理视频移除
const handleVideoRemoved = () => {
  videoFile.value = null;
  // 清空聊天记录
  chatInterfaceRef.value?.clearChat();
  clearChatHistory();
};

// 清空所有数据
const clearAll = () => {
  ElMessageBox.confirm(
    '确定要清空所有数据吗？这将删除上传的视频和所有对话历史。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      handleVideoRemoved();
      ElMessage.success('所有数据已清空');
    })
    .catch(() => {
      // 用户取消操作
    });
};
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #f5f7fa;
}

.app-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.app-card {
  margin-bottom: 20px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-header h2 {
  margin: 0;
  color: #303133;
}
</style> 