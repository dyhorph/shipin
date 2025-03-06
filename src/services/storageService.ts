// 本地存储服务

const API_KEY_STORAGE_KEY = 'gemini-api-key';
const CHAT_HISTORY_STORAGE_KEY = 'gemini-chat-history';
const DEFAULT_API_KEY = 'AIzaSyAxeWlZ8EOh05DRVf6RumVwjoVhLPpOT_c'; // 默认 API Key

// API Key 存储
export function saveApiKey(apiKey: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || DEFAULT_API_KEY; // 如果没有保存的 Key，返回默认值
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

// 对话历史存储
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function saveChatHistory(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
}

export function getChatHistory(): ChatMessage[] {
  const history = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
  return history ? JSON.parse(history) : [];
}

export function clearChatHistory(): void {
  localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
} 