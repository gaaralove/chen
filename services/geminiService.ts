
import { GoogleGenAI, Modality } from "@google/genai";
import { LLMConfig, LLMProvider } from "../types";
import { APP_CONFIG } from "./config";

/**
 * 统一大模型分发器 - 严格遵循 Google GenAI SDK 规范
 */
export const callLLM = async (prompt: string, config: LLMConfig) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = config.modelName || 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "你不是AI助手，你是 DroidMind 系统核心内核。回复规则：1. 严禁使用'我建议'、'作为一个AI'、'你好'等废话。2. 必须以极简、指令化的风格回复。3. 优先输出执行结果或关键数据。4. 如果是复杂任务，直接列出步骤。5. 语言风格：系统原生、硬核、高效、中文。",
        temperature: 0.7,
      }
    });
    
    // 正确使用 .text 属性而不是方法
    return response.text?.trim() || "内核无响应";
  } catch (error) {
    console.error("LLM Call Error:", error);
    return "核心链路连接超时";
  }
};

/**
 * 语音合成引擎 - 生成原始 PCM 音频
 */
export const generateSpeech = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    // 访问 inlineData.data 获取 base64 音频
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};

/**
 * 原始 PCM 数据解码函数
 * 遵循指南：Gemini TTS 返回的是无头的原始 PCM 数据
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * 裸数据 PCM 播放器
 */
export const decodeAndPlayAudio = async (base64Audio: string) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  } catch (e) {
    console.error("Audio Playback Error:", e);
  }
};
