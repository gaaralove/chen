
import React from 'react';
import { MessageSquare, User, PlusCircle, Terminal, Settings } from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'assistant', label: '助手', icon: <MessageSquare size={20} /> },
  { id: 'profile', label: '画像', icon: <User size={20} /> },
  { id: 'plugins', label: '插件', icon: <PlusCircle size={20} /> },
  { id: 'logs', label: '日志', icon: <Terminal size={20} /> },
  { id: 'settings', label: '设置', icon: <Settings size={20} /> },
];

export const INITIAL_TAGS = ['科技达人', '深夜活跃', '美食家'];
