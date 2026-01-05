
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Cpu, Zap, Box, 
  Settings, User, X, Plus, CheckCircle2, MapPin, TrendingUp, Globe, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Utensils, History, ChevronRight, Mic, LayoutGrid, AppWindow, Smartphone
} from 'lucide-react';
import { MemoryService } from './services/memory';
import { AndroidBridge, APP_CONFIG } from './services/config';
import { callLLM, generateSpeech, decodeAndPlayAudio } from './services/geminiService';
import { FoodDeliveryPlugin } from './plugins/FoodDeliveryPlugin';
import { SystemControlPlugin } from './plugins/SystemControlPlugin';
import { DeviceInfoPlugin } from './plugins/DeviceInfoPlugin';
import VoiceCore from './components/VoiceCore';
import ExpansionDoc from './components/ExpansionDoc';
import SettingsPanel from './components/SettingsPanel';
import { AppAction, LLMConfig, LLMProvider, UserProfile, AssistantPlugin } from './types';

const BUILTIN_PLUGINS: AssistantPlugin[] = [FoodDeliveryPlugin, SystemControlPlugin, DeviceInfoPlugin];

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('待命');
  const [lastTranscript, setLastTranscript] = useState('');
  const [showPanel, setShowPanel] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(MemoryService.getProfile());
  const [pluginData, setPluginData] = useState<{ pluginId: string; result: any } | null>(null);
  const [history, setHistory] = useState<AppAction[]>([]);

  const recognitionRef = useRef<any>(null);

  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('droidmind_llm_config');
    return saved ? JSON.parse(saved) : {
      provider: LLMProvider.GEMINI,
      modelName: APP_CONFIG.DEFAULT_LLM,
      apiKey: ''
    };
  });

  useEffect(() => {
    setHistory(MemoryService.getActions().slice(0, 5));
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-CN';
      
      recognition.onstart = () => { 
        setIsListening(true); 
        setStatus('listening'); 
        AndroidBridge.vibrate(12); 
      };
      
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        handleVoiceCommand(text);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        setStatus('待命');
      };
      
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      setStatus('待命');
      recognitionRef.current?.stop();
      AndroidBridge.vibrate(5);
    } else {
      setLastTranscript('');
      recognitionRef.current?.start();
    }
  };

  const handleVoiceCommand = async (command: string) => {
    setLastTranscript(command);
    setStatus('processing');
    const newAction = MemoryService.logAction({ type: 'user', content: command });
    setHistory(prev => [newAction, ...prev].slice(0, 5));
    
    const activePlugin = BUILTIN_PLUGINS.find(p => p.checkIntent(command));
    let executionResult = null;
    
    if (activePlugin) {
      executionResult = await activePlugin.execute(command, { profile });
      setPluginData({ pluginId: activePlugin.manifest.id, result: executionResult });
    }

    const responseText = (activePlugin && executionResult) 
      ? (executionResult.message || "指令已执行")
      : await callLLM(command, llmConfig);

    setProfile(MemoryService.getProfile());
    await speakResponse(responseText);
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    setStatus('speaking');
    const audio = await generateSpeech(text);
    if (audio) await decodeAndPlayAudio(audio);
    setIsSpeaking(false);
    setStatus('待命');
  };

  const triggerPluginDirectly = async (pluginId: string) => {
    AndroidBridge.vibrate(15);
    const plugin = BUILTIN_PLUGINS.find(p => p.manifest.id === pluginId);
    if (plugin) {
      setStatus('processing');
      const result = await plugin.execute('手动触发', { profile });
      setPluginData({ pluginId, result });
      if (result.message) await speakResponse(result.message);
    }
  };

  const handlePluginAction = async (type: string, payload: any) => {
    AndroidBridge.vibrate(15);
    if (type === 'CRAWL_ACCESSIBILITY') {
      setStatus('processing');
      await new Promise(r => setTimeout(r, APP_CONFIG.ACCESSIBILITY_TIMEOUT));
      MemoryService.injectCrawlData(payload);
      const updatedProfile = MemoryService.getProfile();
      setProfile(updatedProfile);
      const res = await FoodDeliveryPlugin.execute('同步完成', { profile: updatedProfile });
      setPluginData({ pluginId: FoodDeliveryPlugin.manifest.id, result: res });
      await speakResponse(`同步完成。画像特征已更新。`);
    } else if (type === 'PLACE_ORDER') {
      const log = MemoryService.logAction({ 
        type: 'plugin', 
        content: `订餐完成: ${payload.name}`, 
        metadata: { pluginId: 'food_delivery', cuisine: payload.cuisine } 
      });
      setHistory(prev => [log, ...prev].slice(0, 5));
      setPluginData({ pluginId: 'food_delivery', result: { step: 'SUCCESS', message: `指令下达。平台节点：${payload.platform}。` } });
      setProfile(MemoryService.getProfile());
      await speakResponse(`操作完成。`);
    } else if (type === 'SYSTEM_CLEANUP') {
      const log = MemoryService.logAction({ type: 'plugin', content: `重塑资源: ${payload.size}` });
      setHistory(prev => [log, ...prev].slice(0, 5));
      setPluginData({ pluginId: 'system_control', result: { step: 'SUCCESS', message: `已清理 ${payload.size} 冗余节点。` } });
      await speakResponse(`加速完成。`);
    } else if (type === 'SYSTEM_REFRESH') {
      triggerPluginDirectly('device_info');
    }
  };

  const resumeFromHistory = async (action: AppAction) => {
    if (action.metadata?.pluginId) {
      triggerPluginDirectly(action.metadata.pluginId);
    }
  };

  const renderPluginGallery = () => (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
         <h2 className="font-black text-slate-800 flex items-center gap-2">插件矩阵</h2>
         <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Active Core</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {BUILTIN_PLUGINS.map(plugin => (
          <button 
            key={plugin.manifest.id}
            onClick={() => {
              triggerPluginDirectly(plugin.manifest.id);
              setShowPanel(null);
            }}
            className="w-full bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all text-left group"
          >
             <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {plugin.manifest.id === 'food_delivery' && <ChefHat size={24}/>}
                {plugin.manifest.id === 'system_control' && <Zap size={24}/>}
                {plugin.manifest.id === 'device_info' && <Cpu size={24}/>}
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-slate-800">{plugin.manifest.name}</h4>
                <p className="text-[10px] text-slate-400 truncate mt-1">{plugin.manifest.description}</p>
             </div>
             <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
          </button>
        ))}
        <div className="pt-6">
           <div className="p-6 bg-slate-900/5 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
              <Plus size={32} className="text-slate-300 mb-4" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">扩展更多能力</p>
              <button 
                onClick={() => setShowPanel('docs')}
                className="mt-4 text-[9px] font-black text-indigo-600 uppercase underline tracking-widest"
              >
                查看开发者集成文档
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900 max-w-md mx-auto border-x border-slate-200 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/60 via-slate-50/0 to-transparent pointer-events-none" />
      
      <header className="px-8 pt-8 pb-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ring-4 ring-white">
            <Cpu size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black text-slate-800 leading-none tracking-tight uppercase">DroidMind</h1>
            <span className="text-[8px] font-black text-indigo-600 mt-2 uppercase tracking-[0.3em]">Neural Interface v1.6</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowPanel('plugins')} className="p-3 bg-white shadow-sm rounded-2xl text-slate-400 border border-slate-100 active:scale-90 transition-transform">
             <LayoutGrid size={20} />
           </button>
           <button onClick={() => setShowPanel('settings')} className="p-3 bg-white shadow-sm rounded-2xl text-slate-400 border border-slate-100 active:scale-90 transition-transform">
             <Settings size={20} />
           </button>
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden flex flex-col px-8">
        {showPanel ? (
          <div className="pb-6 flex-1 overflow-hidden animate-in slide-in-from-bottom duration-400">
            <div className="w-full h-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
               <button onClick={() => setShowPanel(null)} className="absolute top-6 right-6 z-50 p-3 bg-slate-100/80 backdrop-blur rounded-full text-slate-500 hover:text-slate-800"><X size={18}/></button>
               {showPanel === 'docs' ? <ExpansionDoc /> : 
                showPanel === 'settings' ? <SettingsPanel config={llmConfig} onConfigChange={setLlmConfig} onClose={() => setShowPanel(null)} /> :
                showPanel === 'plugins' ? renderPluginGallery() :
                showPanel === 'profile' ? <div className="p-10 text-center flex flex-col items-center justify-center h-full"><TrendingUp size={64} className="text-slate-100 mb-8"/><p className="text-sm text-slate-400 font-black uppercase tracking-widest">神经画像深度解析中...</p></div> : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
               
               <div className={`transition-all duration-500 w-full flex justify-center ${pluginData ? 'absolute -top-16 scale-50 opacity-0 pointer-events-none' : 'relative mb-8'}`}>
                  <VoiceCore isListening={isListening} isSpeaking={isSpeaking} status={status} onClick={toggleVoice} />
               </div>
               
               <div className={`w-full transition-all duration-500 ease-in-out flex flex-col items-center justify-center ${pluginData ? 'h-full py-2' : 'h-1/3 opacity-100'}`}>
                  {lastTranscript && !pluginData && (
                    <div className="bg-white/90 backdrop-blur-2xl px-8 py-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white text-center animate-in zoom-in max-w-full mb-6">
                      <p className="text-xs text-slate-700 font-black italic line-clamp-2 leading-relaxed tracking-tight">“ {lastTranscript} ”</p>
                    </div>
                  )}

                  {pluginData ? (
                    <div className="w-full h-full flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-600">
                      <div className="flex items-center justify-between mb-4 px-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">活跃任务内核</span>
                        </div>
                        <button onClick={() => setPluginData(null)} className="p-2.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 active:scale-90"><X size={16}/></button>
                      </div>
                      <div className="flex-1 min-h-0 bg-white rounded-[3.5rem] border border-slate-100 p-1 shadow-2xl shadow-slate-200/40 overflow-hidden">
                        {pluginData.result.step === 'SUCCESS' ? (
                          <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
                             <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-8 shadow-inner">
                               <CheckCircle2 size={40} className="text-emerald-500" />
                             </div>
                             <h4 className="text-lg font-black text-emerald-900 mb-4">执行完成</h4>
                             <p className="text-sm text-emerald-700/60 leading-relaxed mb-10 px-6 font-bold">{pluginData.result.message}</p>
                             <button onClick={() => setPluginData(null)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-0.4em shadow-2xl active:scale-95 transition-all">返回控制台</button>
                          </div>
                        ) : BUILTIN_PLUGINS.find(p => p.manifest.id === pluginData.pluginId)?.renderUI?.({ 
                            data: pluginData.result, 
                            onAction: handlePluginAction 
                          })}
                      </div>
                    </div>
                  ) : !isListening && !isSpeaking && (
                    <div className="grid grid-cols-2 gap-4 w-full animate-in zoom-in duration-700">
                      <button onClick={() => triggerPluginDirectly('food_delivery')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all group hover:border-orange-200">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm"><Utensils size={24} /></div>
                        <div className="text-center">
                           <span className="text-xs font-black text-slate-800 block">极速订餐</span>
                           <span className="text-[7px] text-slate-300 font-black uppercase tracking-[0.15em]">Life Service</span>
                        </div>
                      </button>
                      <button onClick={() => triggerPluginDirectly('device_info')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all group hover:border-blue-200">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm"><Cpu size={24} /></div>
                        <div className="text-center">
                           <span className="text-xs font-black text-slate-800 block">硬件状态</span>
                           <span className="text-[7px] text-slate-300 font-black uppercase tracking-[0.15em]">Kernel Stats</span>
                        </div>
                      </button>
                      <button onClick={() => triggerPluginDirectly('system_control')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all group hover:border-indigo-200">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm"><Zap size={24} /></div>
                        <div className="text-center">
                           <span className="text-xs font-black text-slate-800 block">深度加速</span>
                           <span className="text-[7px] text-slate-300 font-black uppercase tracking-[0.15em]">Optimizer</span>
                        </div>
                      </button>
                      <button onClick={() => setShowPanel('plugins')} className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 active:scale-95 transition-all group">
                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-all"><LayoutGrid size={24} /></div>
                        <div className="text-center">
                           <span className="text-xs font-black text-white block">插件矩阵</span>
                           <span className="text-[7px] text-white/30 font-black uppercase tracking-[0.15em]">More Tools</span>
                        </div>
                      </button>
                    </div>
                  )}
               </div>
            </div>

            {!pluginData && (
              <div className="shrink-0 space-y-4 pb-8 pt-4">
                <section className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
                   <div className="flex items-center gap-3 mb-4 px-4">
                     <History size={14} className="text-slate-400" />
                     <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">神经连接日志</h3>
                   </div>
                   <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-1">
                      {history.length > 0 ? history.map((item, idx) => (
                        <button 
                          key={item.id} 
                          onClick={() => resumeFromHistory(item)}
                          className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors active:bg-slate-100 ${idx !== 0 ? 'border-t border-slate-50' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${item.type === 'user' ? 'bg-indigo-400' : 'bg-orange-400'}`} />
                          <p className="text-[11px] font-black text-slate-600 truncate flex-1 leading-none text-left">{item.content}</p>
                          <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </button>
                      )) : <div className="p-8 text-center text-[10px] text-slate-300 italic font-black uppercase tracking-widest">无活动链路</div>}
                   </div>
                </section>

                <button 
                  onClick={() => setShowPanel('profile')}
                  className="w-full bg-indigo-600 rounded-[2.5rem] p-6 shadow-2xl flex items-center gap-5 active:scale-[0.98] transition-all border border-white/10 group"
                >
                   <div className="w-14 h-14 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                      <TrendingUp size={28} />
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <h4 className="text-xs font-black text-white uppercase tracking-[0.15em] mb-1">动态画像库</h4>
                      <p className="text-[9px] text-white/60 truncate font-bold">已同步 {profile.orderHistory.length} 节点 · 深度学习中</p>
                   </div>
                   <ChevronRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="px-10 pb-8 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
             <Smartphone size={18} />
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Link Active</p>
        </div>
        <div className="flex gap-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
           <div className="w-2 h-2 rounded-full bg-slate-200" />
        </div>
      </footer>
    </div>
  );
};

export default App;
