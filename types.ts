
import React from 'react';

export interface LocationInfo {
  name: string;
  lat: number;
  lng: number;
  address: string;
  source?: 'Meituan' | 'Eleme' | 'Manual';
}

export interface OrderRecord {
  id: string;
  platform: 'Meituan' | 'Eleme';
  restaurant: string;
  amount: number;
  timestamp: number;
  cuisine: string;
  locationName: string;
}

/**
 * 【用户画像动态模型】
 * 基于插件反馈、历史订单和交互频率生成的加权特征库
 */
export interface UserProfile {
  tags: { name: string; weight: number; trend: 'up' | 'down' | 'stable' }[]; // 带趋势的动态标签
  habits: {
    category: string;
    count: number;
    lastActive: string;
    intensity: number; // 0-1 行为强度
  }[];
  addresses: LocationInfo[]; 
  preferences: {
    avgPrice: number;
    favoriteCuisines: string[];
    activeTimeRange: string; 
  };
  orderHistory: OrderRecord[]; 
}

export interface AppAction {
  id: string;
  type: 'system' | 'plugin' | 'user';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface PluginManifest {
  id: string;
  name: string;
  icon: string;
  description: string;
  version: string;
  capabilities: string[];
}

export interface AssistantPlugin {
  manifest: PluginManifest;
  /** 检查该插件是否能处理当前指令 */
  checkIntent: (input: string) => boolean;
  execute: (input: string, context: any) => Promise<any>;
  renderUI?: (props: { data: any; onAction: (type: string, payload: any) => void }) => React.ReactNode;
}

export enum LLMProvider {
  GEMINI = 'GEMINI',
  DEEPSEEK = 'DEEPSEEK',
  TONGYI = 'TONGYI',
  WENXIN = 'WENXIN'
}

export interface LLMConfig {
  provider: LLMProvider;
  modelName: string;
  apiKey?: string; 
}
