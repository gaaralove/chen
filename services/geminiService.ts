
import { GoogleGenAI, Modality } from "@google/genai";
import { LLMConfig } from "../types";

// 确保在浏览器环境下也能安全访问环境变量
const getApiKey = () => {
  return (window as any).process?.env?.API_KEY || (process as any)?.env?.API_KEY || "";
};

export const callLLM = async (prompt: string, config: LLMConfig) => {
  const apiKey = getApiKey();
  if (!apiKey) return "未检测到系统密钥 (API_KEY)";
  
  const ai = new GoogleGenAI({ apiKey });
  const modelId = config.modelName || 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "你现在是 DroidMind 系统的智能内核。1. 严禁废话，直接输出结果。2. 必须以硬核、系统指令化的中文风格回复。3. 复杂任务分步列出。4. 保持绝对的高效与原生感。",
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "内核无响应";
  } catch (error) {
    console.error("LLM Call Error:", error);
    return "核心链路连接超时，请检查网络或密钥状态。";
  }
};

export const generateSpeech = async (text: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
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
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) {
    console.error("TTS Error:", e);
    return null;
  }
};

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
