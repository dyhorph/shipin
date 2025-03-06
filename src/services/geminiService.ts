// Gemini API 服务
import { GoogleGenerativeAI } from '@google/generative-ai';

// 系统提示词
const SYSTEM_PROMPT = "我会发你一段特殊儿童的康复训练视频，请你仔细阅读视频内容，并根据视频内容，从参与度、情绪状态、任务完成情况与正确率、能力现状的角度来评估儿童表现；从指令清晰度与适宜性、提示策略等角度来评估康复训练教师的表现。如果还有更多要求，我会稍后补充给你。";

// 创建 Gemini API 客户端
function createClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

// 准备视频文件
export async function prepareVideo(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<File> {
  // 模拟上传进度
  if (onProgress) {
    // 由于实际上不需要上传，我们模拟一个进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        clearInterval(interval);
        onProgress(100);
      } else {
        onProgress(progress);
      }
    }, 300);
  }
  
  // 直接返回文件对象
  return file;
}

// 生成内容（包含视频）- 流式输出
export async function generateContent(
  file: File, 
  prompt: string, 
  apiKey: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const genAI = createClient(apiKey);
  // 使用 gemini-1.5-pro 模型
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  try {
    // 创建包含视频的请求，添加系统提示词
    const fileData = await fileToGenerativePart(file);
    const combinedPrompt = `${SYSTEM_PROMPT}\n\n用户问题: ${prompt}`;
    
    // 使用流式响应
    if (onStream) {
      const result = await model.generateContentStream([combinedPrompt, fileData]);
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onStream(chunkText);
      }
      
      return fullResponse;
    } else {
      // 兼容非流式调用
      const result = await model.generateContent([combinedPrompt, fileData]);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error('生成内容失败:', error);
    throw new Error(`生成内容失败: ${(error as Error).message}`);
  }
}

// 继续对话（不包含视频）- 流式输出
export async function continueConversation(
  history: Array<{ role: string, content: string }>,
  prompt: string,
  apiKey: string,
  onStream?: (chunk: string) => void
): Promise<string> {
  const genAI = createClient(apiKey);
  // 使用 gemini-1.5-pro 模型
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  try {
    // 准备历史记录，添加系统提示词作为第一条消息（如果不存在）
    let chatHistory = [...history];
    if (chatHistory.length === 0 || chatHistory[0].content !== SYSTEM_PROMPT) {
      chatHistory = [{ role: 'model', content: SYSTEM_PROMPT }, ...chatHistory];
    }
    
    // 创建聊天会话
    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });
    
    // 使用流式响应
    if (onStream) {
      const result = await chat.sendMessageStream(prompt);
      let fullResponse = '';
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        onStream(chunkText);
      }
      
      return fullResponse;
    } else {
      // 兼容非流式调用
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    }
  } catch (error) {
    console.error('生成内容失败:', error);
    throw new Error(`生成内容失败: ${(error as Error).message}`);
  }
}

// 将文件转换为 GenerativePart
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // 移除 data URL 前缀 (e.g., "data:video/mp4;base64,")
      const base64EncodedData = (reader.result as string).split(',')[1];
      resolve(base64EncodedData);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type
    }
  };
} 