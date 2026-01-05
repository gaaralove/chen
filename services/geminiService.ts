
import { GoogleGenAI, Modality } from "@google/genai";
import { LLMConfig, LLMProvider } from "../types";
import { APP_CONFIG } from "./config";

/**
 * 统一大模型分发器 - 极致去 AI 化优化
 */
export const callLLM = async (prompt: string, config: LLMConfig) => {
  if (config.provider === LLMProvider.GEMINI) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: config.modelName || APP_CONFIG.DEFAULT_LLM,
        contents: prompt,
        config: {
          systemInstruction: "你不是AI助手，你是 DroidMind 系统核心内核。回复规则：1. 严禁使用'我建议'、'作为一个AI'、'你好'等废话。2. 必须以极简、冷峻、指令化的风格回复。3. 优先输出执行结果或关键数据。4. 如果是复杂任务，直接列出步骤。5. 语言风格：系统原生、硬核、高效、中文。"
        }
      });
      return response.text?.trim() || "指令响应异常";
    } catch (error) {
      return "核心连接超时";
    }
  }
  return `[${config.provider}] 反馈：${prompt}`;
};

/**
 * 语音合成引擎 - 提速版
 */
export const generateSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }], // 取消引导词，直接朗读文本以提升速度
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    return null;
  }
};

/**
 * 裸数据 PCM 播放器
 */
export const decodeAndPlayAudio = async (base64Audio: string) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const bytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  buffer.getChannelData(0).set(Array.from(dataInt16).map(v => v / 32768.0));
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};
