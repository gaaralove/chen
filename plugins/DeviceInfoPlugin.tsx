
import React from 'react';
import { Cpu, Thermometer, Battery, Activity, ShieldCheck, RefreshCcw, HardDrive } from 'lucide-react';
import { AssistantPlugin } from '../types';

export const DeviceInfoPlugin: AssistantPlugin = {
  manifest: {
    id: 'device_info',
    name: '硬件监控',
    icon: 'Cpu',
    description: '实时监测 Android 底层硬件状态与系统资源水位。',
    version: '1.2.0',
    capabilities: ['thermal_monitor', 'battery_health', 'storage_analyzer'],
    category: 'system'
  },

  checkIntent: (input: string) => {
    return /(设备|手机|硬件|温度|电量|内存|CPU|存储)/i.test(input);
  },

  execute: async (input: string) => {
    // 模拟从 Android Bridge 获取真实数据
    const stats = {
      cpuUsage: 34,
      ramFree: '2.4 GB',
      temp: 38.5,
      batteryLevel: 82,
      isCharging: false,
      storage: '128GB / 256GB',
      health: '良好'
    };

    return { 
      step: 'DASHBOARD', 
      stats,
      message: `内核报告：当前 SoC 温度 ${stats.temp}℃，系统负载正常。` 
    };
  },

  renderUI: ({ data, onAction }) => {
    if (data.step === 'DASHBOARD') {
      const { stats } = data;
      return (
        <div className="h-full flex flex-col p-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Cpu size={28} />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-800 tracking-tight">硬件状态面板</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Android Kernel Monitor</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
              <Thermometer size={18} className="text-orange-500" />
              <div className="text-xl font-black text-slate-900">{stats.temp}℃</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">核心温度</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
              <Battery size={18} className={stats.batteryLevel < 20 ? 'text-rose-500' : 'text-emerald-500'} />
              <div className="text-xl font-black text-slate-900">{stats.batteryLevel}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">当前电量</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
              <Activity size={18} className="text-blue-500" />
              <div className="text-xl font-black text-slate-900">{stats.cpuUsage}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">CPU 负载</div>
            </div>
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-2">
              <HardDrive size={18} className="text-indigo-500" />
              <div className="text-xl font-black text-slate-900">{stats.ramFree}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">可用内存</div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <ShieldCheck size={24} className="text-emerald-400" />
               <div>
                  <div className="text-xs font-black text-white">系统安全状态</div>
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Security: {stats.health}</div>
               </div>
            </div>
            <button 
              onClick={() => onAction('SYSTEM_REFRESH', null)}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <RefreshCcw size={18} />
            </button>
          </div>

          <button 
            onClick={() => onAction('DEEP_SCAN', null)}
            className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] active:scale-95 transition-all mt-auto"
          >
            启动全域扫描
          </button>
        </div>
      );
    }
    return null;
  }
};
