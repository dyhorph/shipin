<template>
  <div class="chat-interface">
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        class="message" 
        :class="message.role"
      >
        <div class="message-content">
          <div v-html="formatMessage(message.content)"></div>
        </div>
        <div class="message-time">
          {{ formatTime(message.timestamp) }}
        </div>
      </div>
      
      <div v-if="loading" class="message assistant loading">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <!-- 消息输入框 -->
    <div class="message-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        placeholder="输入您的问题或提示..."
        :disabled="loading || !canSend"
        @keydown.ctrl.enter="sendMessage"
      />
      <el-button 
        type="primary" 
        :disabled="loading || !canSend || !inputMessage.trim()" 
        @click="sendMessage"
      >
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { generateContent, continueConversation } from '../services/geminiService';
import { ChatMessage, saveChatHistory, getChatHistory } from '../services/storageService';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps<{
  apiKey: string;
  videoFile?: File | null;
}>();

const messages = ref<ChatMessage[]>([]);
const inputMessage = ref('');
const loading = ref(false);
const messageListRef = ref<HTMLElement | null>(null);
const videoProcessed = ref(false);

// 是否可以发送消息
const canSend = computed(() => {
  return !!props.videoFile || videoProcessed.value;
});

// 初始化时加载历史消息
onMounted(() => {
  messages.value = getChatHistory();
  
  // 如果有历史消息，说明视频已经处理过
  if (messages.value.length > 0) {
    videoProcessed.value = true;
  }
  
  // 滚动到底部
  scrollToBottom();
});

// 监听消息变化，保存到本地存储
watch(messages, (newMessages) => {
  saveChatHistory(newMessages);
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value || !canSend.value) return;
  
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    role: 'user',
    content: inputMessage.value,
    timestamp: Date.now()
  };
  
  messages.value.push(userMessage);
  const userInput = inputMessage.value;
  inputMessage.value = '';
  loading.value = true;
  
  try {
    // 创建一个空的助手回复消息，用于流式更新
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    
    messages.value.push(assistantMessage);
    
    // 处理流式响应的回调函数
    const handleStream = (chunk: string) => {
      assistantMessage.content += chunk;
      // 强制滚动到底部以跟随新内容
      nextTick(() => {
        scrollToBottom();
      });
    };
    
    // 准备历史记录 - 将所有现有消息转换为适合API的格式
    const history = messages.value.slice(0, -2).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // 如果是第一条消息且有视频，使用视频生成内容
    if (!videoProcessed.value && props.videoFile) {
      await generateContent(
        props.videoFile,
        userInput,
        props.apiKey,
        handleStream
      );
      videoProcessed.value = true;
    } else {
      // 否则继续对话，传递历史记录
      await continueConversation(
        history,
        userInput,
        props.apiKey,
        handleStream
      );
    }
  } catch (error) {
    // 如果出错，更新最后一条消息为错误信息
    if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant') {
      messages.value[messages.value.length - 1].content = `获取回复失败: ${(error as Error).message}`;
    } else {
      // 添加错误消息
      messages.value.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: `获取回复失败: ${(error as Error).message}`,
        timestamp: Date.now()
      });
    }
    
    ElMessage.error(`获取回复失败: ${(error as Error).message}`);
  } finally {
    loading.value = false;
  }
};

// 格式化消息内容（支持 Markdown）
const formatMessage = (content: string): string => {
  // 使用 marked 解析 Markdown
  const html = marked(content);
  // 使用 DOMPurify 清理 HTML
  return DOMPurify.sanitize(html);
};

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// 清空聊天记录
const clearChat = () => {
  messages.value = [];
  videoProcessed.value = false;
};

// 导出方法供父组件使用
defineExpose({ clearChat });
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 500px;
  min-height: 300px;
}

.message {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 8px;
  position: relative;
}

.message.user {
  align-self: flex-end;
  background-color: #ecf5ff;
  color: #303133;
}

.message.assistant {
  align-self: flex-start;
  background-color: #f5f7fa;
  color: #303133;
}

.message-content {
  word-break: break-word;
  line-height: 1.5;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: right;
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 10px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #909399;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 
  40% { 
    transform: scale(1.0);
  }
}

.message-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #dcdfe6;
}

.message-input .el-input {
  flex: 1;
}
</style> 