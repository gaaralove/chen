
import React from 'react';
import { Smartphone, Code2, Link, ShieldCheck, Zap, Layers, Cpu, SmartphoneNfc, Terminal, HardDrive } from 'lucide-react';

const ExpansionDoc: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden select-none">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white shadow-sm z-10">
        <h2 className="font-black text-slate-800 flex items-center gap-3">
          <Code2 size={22} className="text-blue-600" /> DroidMind 内核集成手册
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-12">
        {/* 系统应用集成核心板块 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-slate-900">
            <HardDrive size={24} className="text-rose-600" />
            <h3 className="text-base font-black uppercase tracking-widest">安卓系统级集成 (System App)</h3>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-8">
             <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck size={14} className="text-emerald-500" /> 步骤 A：权限提权 (Manifest)
               </h4>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 在 <code>AndroidManifest.xml</code> 中添加以下配置以获得底层硬件控制权：
               </p>
               <div className="bg-slate-900 p-5 rounded-2xl font-mono text-[10px] text-emerald-400 overflow-x-auto">
                 {`<manifest xmlns:android="..."
    android:sharedUserId="android.uid.system">
    <uses-permission android:name="android.permission.REAL_GET_TASKS" />
    <uses-permission android:name="android.permission.FORCE_STOP_PACKAGES" />
</manifest>`}
               </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={14} className="text-amber-500" /> 步骤 B：平台签名 (Signing)
               </h4>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 使用目标设备的 <code>platform.pk8</code> 和 <code>platform.x509.pem</code> 进行二次签名，确保系统信任：
               </p>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-[10px] text-slate-500">
                 注：若无平台密钥，可安装至 /system/app 但无法获得系统核心 UID。
               </div>
             </div>

             <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Terminal size={14} className="text-blue-500" /> 步骤 C：文件挂载 (Mounting)
               </h4>
               <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 通过 ADB 将 APK 推送至特权分区：
               </p>
               <div className="bg-slate-900 p-5 rounded-2xl font-mono text-[10px] text-blue-300">
                 {`adb root
adb remount
adb push DroidMind.apk /system/priv-app/
adb reboot`}
               </div>
             </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-slate-800">
            <Smartphone size={24} className="text-blue-600" />
            <h3 className="text-base font-black uppercase tracking-widest">Capacitor 桥接流程</h3>
          </div>
          <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-start gap-5">
               <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-xs font-black text-blue-600 shrink-0">1</div>
               <p className="text-xs text-slate-500 leading-relaxed">
                 执行 <code>npm install @capacitor/android</code> 并同步项目。
               </p>
             </div>
             <div className="flex items-start gap-5">
               <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-xs font-black text-blue-600 shrink-0">2</div>
               <p className="text-xs text-slate-500 leading-relaxed">
                 在 <code>MainActivity.java</code> 中注入 <code>AndroidBridge</code> 实例，将原生 Java 方法暴露给 JS 环境。
               </p>
             </div>
          </div>
        </section>

        <section className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute -right-10 -top-10 opacity-10 rotate-12"><SmartphoneNfc size={180} /></div>
           <div className="flex items-center gap-4 mb-6">
             <Link size={24} className="text-blue-400" />
             <h4 className="text-base font-black uppercase tracking-widest">Native Bridge 规范</h4>
           </div>
           <p className="text-xs opacity-60 mb-6 leading-relaxed font-medium">
             DroidMind 核心已预留原生接口，检测到 <code>window.Android</code> 后将自动激活：
           </p>
           <div className="bg-black/40 p-6 rounded-3xl font-mono text-[11px] text-blue-300 leading-relaxed border border-white/5">
             {`// 获取底层硬件状态
const cpuTemp = await AndroidBridge.getInternalTemp();

// 触发特权级进程清理
AndroidBridge.forceStopPackage("com.example.app");`}
           </div>
        </section>

        <footer className="pt-10 border-t border-slate-200 text-center">
           <p className="text-[10px] text-slate-400 font-black tracking-[0.5em] uppercase">DroidMind Enterprise SDK v1.6</p>
        </footer>
      </div>
    </div>
  );
};

export default ExpansionDoc;
