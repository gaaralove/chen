
import React from 'react';
import { Settings, Zap, Battery, Trash2, Cpu, Activity, MousePointer2 } from 'lucide-react';
import { AssistantPlugin } from '../types';

export const SystemControlPlugin: AssistantPlugin = {
  manifest: {
    id: 'system_control',
    name: '内核加速',
    icon: 'Zap',
    description: 'Android 底层资源动态重分配与进程管控。',
    version: '2.6.0',
    capabilities: ['ram_boost', 'process_kill', 'battery_save'],
    // Added category to satisfy PluginManifest interface requirements
    category: 'system'
  },

  checkIntent: (input: string) => {
    return /(加速|清理|优化|卡顿|电池|系统|释放|快点)/.test(input);
  },

  execute: async (input: string) => {
    if (input.includes('电池') || input.includes('省电')) {
      return { step: 'BATTERY', message: '功耗画像策略已切换：深夜静默。' };
    }
    return { 
      step: 'SCANNING', 
      apps: [
        { name: '系统后台残留', usage: '512MB', load: '高' },
        { name: '地理定位服务', usage: '180MB', load: '中' },
        { name: '第三方缓存节点', usage: '1.1GB', load: '高' }
      ],
      totalUsage: '82%',
      message: '系统分析：主线程资源占用异常。' 
    };
  },

  renderUI: ({ data, onAction }) => {
    if (data.step === 'SCANNING') {
      return (
        <div className="h-full flex flex-col p-8 animate-in fade-in">
          <div className="flex items-center justify-between mb-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Activity size={28} />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-800">实时资源负载</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">MEM LOAD: {data.totalUsage}</p>
              </div>
            </div>
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-10">
            {data.apps.map((app: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${app.load === '高' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <div className="text-xs font-black text-slate-800">{app.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">占位节点: {app.usage}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onAction('SYSTEM_CLEANUP', { size: '1.8GB' })}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl active:scale-[0.95] flex items-center justify-center gap-3"
          >
            <Zap size={20} className="fill-current" /> 重塑内核资源栈
          </button>
        </div>
      );
    }

    if (data.step === 'BATTERY') {
      return (
        <div className="h-full flex flex-col p-10 items-center justify-center text-center">
           <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner">
             <Battery size={48} className="text-emerald-500" />
           </div>
           <h4 className="text-lg font-black text-emerald-900 mb-3">功耗曲线优化</h4>
           <p className="text-xs text-emerald-700/60 font-bold mb-10 px-6 leading-relaxed">检测到当前环境节点。无障碍服务已管控后台冗余请求。</p>
           <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-emerald-500 w-2/3 animate-[shimmer_2s_infinite]" />
           </div>
        </div>
      );
    }

    return null;
  }
};
