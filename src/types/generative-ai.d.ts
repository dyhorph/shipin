declare module '@google/generative-ai' {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    
    getGenerativeModel(options: { model: string }): GenerativeModel;
  }
  
  export interface Part {
    text?: string;
    inlineData?: {
      data: string;
      mimeType: string;
    };
  }
  
  export interface GenerativeModel {
    generateContent(parts: (string | { inlineData: { data: string; mimeType: string } })[]): Promise<{ response: Response }>;
    startChat(options?: { history?: { role: string; parts: Part[] }[] }): Chat;
  }
  
  export interface Chat {
    sendMessage(text: string): Promise<{ response: Response }>;
  }
  
  export interface Response {
    text(): string;
  }
} 