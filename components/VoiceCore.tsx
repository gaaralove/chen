
import React from 'react';
import { Mic, Square } from 'lucide-react';

interface VoiceCoreProps {
  isListening: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  status: string;
}

const VoiceCore: React.FC<VoiceCoreProps> = ({ isListening, isSpeaking, onClick, status }) => {
  const getStatusText = (s: string) => {
    switch(s.toLowerCase()) {
      case 'listening': return '信号采集';
      case 'processing': return '内核计算';
      case 'speaking': return '反馈中';
      case 'standby': return '系统就绪';
      default: return 'DroidMind Core';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 space-y-6 select-none shrink-0 w-full">
      <div className="relative group touch-none" onClick={onClick}>
        <div className={`absolute -inset-10 rounded-full blur-3xl transition-all duration-300 opacity-20 ${
          isListening ? 'bg-blue-500 animate-pulse scale-125' : 
          isSpeaking ? 'bg-indigo-500 scale-110' : 
          'bg-slate-200 opacity-5'
        }`} />
        
        <div className={`relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-200 border-4 active:scale-90 ${
          isListening ? 'bg-blue-600 border-blue-200 scale-105 shadow-blue-500/40 rotate-12' : 
          isSpeaking ? 'bg-slate-900 border-indigo-400 shadow-indigo-500/30' : 
          'bg-white border-slate-100 shadow-slate-200'
        }`}>
          {isListening ? (
             <div className="relative flex items-center justify-center animate-in zoom-in duration-150">
                <div className="absolute w-16 h-16 bg-white/20 rounded-full animate-ping" />
                <Square size={36} className="text-white fill-current" />
             </div>
          ) : isSpeaking ? (
             <div className="flex items-end gap-1.5 h-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} 
                       className="w-1.5 bg-indigo-400 rounded-full animate-bounce" 
                       style={{ animationDelay: `${i * 0.08}s`, height: `${40 + Math.random() * 60}%` }} 
                  />
                ))}
             </div>
          ) : (
            <Mic size={40} className="text-slate-900 animate-in fade-in duration-300" />
          )}
        </div>
      </div>
      
      <div className="text-center space-y-3 pointer-events-none">
        <div className={`px-4 py-1.5 rounded-full inline-block text-[9px] font-black tracking-widest uppercase shadow-sm transition-all duration-200 ${
          isListening ? 'bg-blue-600 text-white translate-y-[-2px]' : 
          isSpeaking ? 'bg-indigo-600 text-white' : 
          'bg-slate-200 text-slate-500'
        }`}>
          {getStatusText(status)}
        </div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-opacity duration-200 ${isListening || isSpeaking ? 'text-slate-600 opacity-100' : 'text-slate-400 opacity-60'}`}>
          {isListening ? "终止采集" : "激活系统"}
        </p>
      </div>
    </div>
  );
};

export default VoiceCore;
