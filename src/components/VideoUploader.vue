<template>
  <div class="video-uploader">
    <div 
      class="upload-area" 
      :class="{ 'is-dragover': isDragover }"
      @dragover.prevent="onDragover"
      @dragleave.prevent="onDragleave"
      @drop.prevent="onDrop"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file" 
        accept="video/*"
        style="display: none"
        @change="onFileChange"
      />
      
      <div v-if="!videoFile && !uploading" class="upload-placeholder">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">点击或拖拽上传视频</div>
        <div class="upload-hint">支持 MP4、WebM 等格式，最大 20MB</div>
      </div>
      
      <div v-if="uploading" class="upload-progress">
        <el-progress 
          type="circle" 
          :percentage="uploadProgress" 
          :status="uploadProgress === 100 ? 'success' : ''"
        />
        <div class="progress-text">{{ uploadStatus }}</div>
      </div>
      
      <div v-if="videoFile && !uploading" class="video-preview">
        <video 
          controls 
          :src="videoPreviewUrl" 
          style="max-width: 100%; max-height: 300px;"
        ></video>
        <div class="video-info">
          <span>{{ videoFile.name }}</span>
          <span>{{ formatFileSize(videoFile.size) }}</span>
        </div>
        <el-button type="danger" @click="removeVideo">删除视频</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { prepareVideo } from '../services/geminiService';

const props = defineProps<{
  apiKey: string;
}>();

const emit = defineEmits<{
  (e: 'upload-complete', data: { file: File }): void;
  (e: 'upload-error', error: Error): void;
  (e: 'video-removed'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const videoFile = ref<File | null>(null);
const videoPreviewUrl = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('');
const isDragover = ref(false);

// 触发文件选择
const triggerFileInput = () => {
  if (!uploading.value && fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择变化
const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFile(input.files[0]);
  }
};

// 处理拖拽
const onDragover = () => {
  isDragover.value = true;
};

const onDragleave = () => {
  isDragover.value = false;
};

const onDrop = (event: DragEvent) => {
  isDragover.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    handleFile(event.dataTransfer.files[0]);
  }
};

// 处理选择的文件
const handleFile = (file: File) => {
  if (!file.type.startsWith('video/')) {
    ElMessage.error('请上传视频文件');
    return;
  }
  
  // 将大小限制从 2GB 改为 20MB
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  if (file.size > MAX_SIZE) {
    ElMessage.error('文件大小不能超过 20MB');
    return;
  }
  
  videoFile.value = file;
  videoPreviewUrl.value = URL.createObjectURL(file);
  
  // 开始处理
  startProcess();
};

// 开始处理过程
const startProcess = async () => {
  if (!videoFile.value) return;
  
  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = '正在处理视频...';
  
  try {
    // 准备视频
    const processedFile = await prepareVideo(
      videoFile.value, 
      (progress) => {
        uploadProgress.value = progress;
      }
    );
    
    // 处理完成
    uploadProgress.value = 100;
    uploadStatus.value = '处理完成';
    uploading.value = false;
    
    // 通知父组件
    emit('upload-complete', { file: processedFile });
    
    ElMessage.success('视频处理成功');
  } catch (error) {
    uploading.value = false;
    uploadStatus.value = '处理失败';
    emit('upload-error', error as Error);
    ElMessage.error(`处理失败: ${(error as Error).message}`);
  }
};

// 删除视频
const removeVideo = () => {
  if (videoPreviewUrl.value) {
    URL.revokeObjectURL(videoPreviewUrl.value);
  }
  
  videoFile.value = null;
  videoPreviewUrl.value = '';
  uploadProgress.value = 0;
  
  emit('video-removed');
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};
</script>

<style scoped>
.video-uploader {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area.is-dragover {
  border-color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.upload-icon {
  font-size: 48px;
  color: #909399;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 5px;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
}

.progress-text {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.video-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.video-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 14px;
  color: #606266;
}
</style> 