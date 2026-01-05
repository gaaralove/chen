
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Cpu, Zap, Settings, X, Plus, CheckCircle2, MapPin, 
  TrendingUp, Utensils, History, ChevronRight, LayoutGrid, Smartphone
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
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('droidmind_llm_config');
    return saved ? JSON.parse(saved) : {
      provider: LLMProvider.GEMINI,
      modelName: APP_CONFIG.DEFAULT_LLM,
      apiKey: ''
    };
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setHistory(MemoryService.getActions().slice(0, 5));
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'zh-CN';
      
      recognition.onstart = () => { 
        setIsListening(true); 
        setStatus('listening'); 
        AndroidBridge.vibrate(10); 
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
      recognitionRef.current?.stop();
    } else {
      setLastTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Speech Start Error:", e);
        // Fallback for some browsers
        const mockText = prompt("模拟语音输入内容:");
        if (mockText) handleVoiceCommand(mockText);
      }
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
      ? (executionResult.message || "已按指令处理")
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
      await speakResponse(`同步完成，画像已更新。`);
    } else if (type === 'PLACE_ORDER') {
      MemoryService.logAction({ 
        type: 'plugin', 
        content: `订餐执行: ${payload.name}`, 
        metadata: { pluginId: 'food_delivery', cuisine: payload.cuisine } 
      });
      setPluginData({ pluginId: 'food_delivery', result: { step: 'SUCCESS', message: `指令已下达，平台：${payload.platform}。` } });
      setProfile(MemoryService.getProfile());
      await speakResponse(`操作成功。`);
    } else if (type === 'SYSTEM_CLEANUP') {
      MemoryService.logAction({ type: 'plugin', content: `资源释放: ${payload.size}` });
      setPluginData({ pluginId: 'system_control', result: { step: 'SUCCESS', message: `已成功释放 ${payload.size} 系统资源。` } });
      await speakResponse(`清理加速完成。`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900 max-w-md mx-auto border-x border-slate-200 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/60 via-slate-50/0 to-transparent pointer-events-none" />
      
      <header className="px-8 pt-10 pb-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl ring-4 ring-white">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">DroidMind</h1>
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.3em]">Neural Interface</span>
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
          <div className="pb-6 flex-1 overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="w-full h-full bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden relative">
               <button onClick={() => setShowPanel(null)} className="absolute top-6 right-6 z-50 p-3 bg-slate-100/80 backdrop-blur rounded-full text-slate-500 hover:text-slate-800"><X size={18}/></button>
               {showPanel === 'docs' ? <ExpansionDoc /> : 
                showPanel === 'settings' ? <SettingsPanel config={llmConfig} onConfigChange={setLlmConfig} onClose={() => setShowPanel(null)} /> :
                showPanel === 'plugins' ? (
                  <div className="flex flex-col h-full bg-slate-50">
                    <div className="p-6 bg-white border-b border-slate-100"><h2 className="font-black">插件中心</h2></div>
                    <div className="p-6 space-y-4 overflow-y-auto no-scrollbar">
                      {BUILTIN_PLUGINS.map(p => (
                        <button key={p.manifest.id} onClick={() => {triggerPluginDirectly(p.manifest.id); setShowPanel(null);}} className="w-full p-5 bg-white rounded-[2rem] border border-slate-100 flex items-center gap-4 active:scale-95 transition-all">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-500">
                             {p.manifest.id === 'food_delivery' && <ChefHat size={24}/>}
                             {p.manifest.id === 'system_control' && <Zap size={24}/>}
                             {p.manifest.id === 'device_info' && <Cpu size={24}/>}
                          </div>
                          <div className="text-left flex-1">
                            <h4 className="text-xs font-black">{p.manifest.name}</h4>
                            <p className="text-[10px] text-slate-400">{p.manifest.description}</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-200" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <div className={`transition-all duration-500 w-full flex justify-center ${pluginData ? 'opacity-0 scale-50 pointer-events-none' : ''}`}>
                  <VoiceCore isListening={isListening} isSpeaking={isSpeaking} status={status} onClick={toggleVoice} />
               </div>
               
               {pluginData && (
                  <div className="absolute inset-0 z-50 animate-in slide-in-from-bottom-10 duration-500 bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden p-1">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">任务执行中</span>
                       <button onClick={() => setPluginData(null)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={16}/></button>
                    </div>
                    <div className="h-full">
                      {pluginData.result.step === 'SUCCESS' ? (
                        <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
                           <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6"><CheckCircle2 size={40} className="text-emerald-500" /></div>
                           <p className="text-sm font-bold text-slate-700">{pluginData.result.message}</p>
                           <button onClick={() => setPluginData(null)} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest">返回</button>
                        </div>
                      ) : BUILTIN_PLUGINS.find(p => p.manifest.id === pluginData.pluginId)?.renderUI?.({ data: pluginData.result, onAction: handlePluginAction })}
                    </div>
                  </div>
               )}

               {!pluginData && (
                 <div className="grid grid-cols-2 gap-4 w-full mt-10">
                    <button onClick={() => triggerPluginDirectly('food_delivery')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all">
                       <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center"><Utensils size={24} /></div>
                       <span className="text-[11px] font-black uppercase">极速订餐</span>
                    </button>
                    <button onClick={() => triggerPluginDirectly('system_control')} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center gap-4 active:scale-95 transition-all">
                       <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center"><Zap size={24} /></div>
                       <span className="text-[11px] font-black uppercase">一键清理</span>
                    </button>
                 </div>
               )}
            </div>

            <div className="shrink-0 space-y-4 pb-10">
               <div className="bg-white rounded-[2rem] border border-slate-100 p-1">
                  {history.length > 0 ? history.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-4 px-6 py-4 ${idx !== 0 ? 'border-t border-slate-50' : ''}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'user' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                      <p className="text-[10px] font-bold text-slate-600 truncate flex-1">{item.content}</p>
                    </div>
                  )) : <div className="p-4 text-center text-[9px] text-slate-300 uppercase tracking-widest">无连接记录</div>}
               </div>

               <button onClick={() => setShowPanel('profile')} className="w-full bg-indigo-600 rounded-[2.5rem] p-6 flex items-center justify-between shadow-xl shadow-indigo-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white"><TrendingUp size={24}/></div>
                    <div className="text-left">
                       <h4 className="text-xs font-black text-white uppercase tracking-widest">系统画像</h4>
                       <p className="text-[9px] text-white/60 font-bold">已同步 {profile.orderHistory.length} 个节点</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/40" />
               </button>
            </div>
          </div>
        )}
      </main>

      <footer className="px-10 pb-10 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
           <Smartphone size={16} className="text-slate-300" />
           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Kernel v1.0 PRO</span>
        </div>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <div className="w-2 h-2 rounded-full bg-slate-200" />
        </div>
      </footer>
    </div>
  );
};

export default App;
