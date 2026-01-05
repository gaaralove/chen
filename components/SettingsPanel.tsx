
import React, { useState } from 'react';
import { Settings, Shield, Cpu, Key, ChevronDown, ChevronUp, AlertCircle, Info, X } from 'lucide-react';
import { LLMConfig, LLMProvider } from '../types';

interface SettingsPanelProps {
  config: LLMConfig;
  onConfigChange: (config: LLMConfig) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onConfigChange, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('provider');

  const providers = [
    { id: LLMProvider.GEMINI, name: 'Google Gemini', desc: '官方推荐：具备最强系统集成能力' },
    { id: LLMProvider.DEEPSEEK, name: '深度求索 (DeepSeek)', desc: '国产黑马：超强中文逻辑推理' },
    { id: LLMProvider.TONGYI, name: '阿里通义千问', desc: '大厂背书：中文生态适配度极高' },
    { id: LLMProvider.WENXIN, name: '百度文心一言', desc: '老牌实力：庞大的中文知识库' },
  ];

  const handleChange = (field: keyof LLMConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white shadow-sm">
        <h2 className="font-black text-slate-800 flex items-center gap-2">控制中心</h2>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 active:scale-90"><X size={20}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* 模型供应商 - 手风琴 */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('provider')}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cpu size={18} className="text-blue-500" />
              <span className="text-sm font-black text-slate-800">大模型引擎</span>
            </div>
            {expandedSection === 'provider' ? <ChevronUp size={18} className="text-slate-300"/> : <ChevronDown size={18} className="text-slate-300"/>}
          </button>
          
          {expandedSection === 'provider' && (
            <div className="p-5 pt-0 grid gap-2 animate-in fade-in slide-in-from-top-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleChange('provider', p.id)}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    config.provider === p.id 
                      ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="text-xs font-black text-slate-800">{p.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">{p.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 端点配置 - 手风琴 */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleSection('config')}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-500" />
              <span className="text-sm font-black text-slate-800">开发者 API 配置</span>
            </div>
            {expandedSection === 'config' ? <ChevronUp size={18} className="text-slate-300"/> : <ChevronDown size={18} className="text-slate-300"/>}
          </button>

          {expandedSection === 'config' && (
            <div className="p-5 pt-0 space-y-5 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">模型标识 (Model ID)</label>
                <input 
                  type="text"
                  value={config.modelName}
                  placeholder="例如: gemini-3-flash-preview"
                  onChange={(e) => handleChange('modelName', e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-2xl text-xs border-none focus:ring-2 ring-blue-100 outline-none font-bold"
                />
              </div>
              {config.provider !== LLMProvider.GEMINI && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">API 密钥</label>
                  <div className="relative">
                    <input 
                      type="password"
                      placeholder="输入您的端点密钥"
                      value={config.apiKey || ''}
                      onChange={(e) => handleChange('apiKey', e.target.value)}
                      className="w-full p-4 bg-slate-50 rounded-2xl text-xs border-none focus:ring-2 ring-blue-100 outline-none pr-12 font-bold"
                    />
                    <Key size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white mt-6 shadow-xl">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                <Info size={20} className="text-white" />
             </div>
             <div>
               <h4 className="text-[11px] font-black uppercase tracking-widest">核心权限状态</h4>
               <p className="text-[10px] text-slate-500 mt-1 font-medium">DroidMind 已获得：无障碍服务、精准定位及通知访问权限。</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
