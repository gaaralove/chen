
import React from 'react';
import { ChefHat, Smartphone, MousePointer2, Sparkles, Accessibility, MapPin, Clock, Utensils, Star, ChevronRight, Info } from 'lucide-react';
import { AssistantPlugin } from '../types';
import { MemoryService } from '../services/memory';

export const FoodDeliveryPlugin: AssistantPlugin = {
  manifest: {
    id: 'food_delivery',
    name: '极速订餐',
    icon: 'ChefHat',
    description: '核心功能：基于地理位置与历史画像的自动化订餐建议。',
    version: '9.6.0',
    capabilities: ['geo_profile_sync', 'one_tap_order', 'accessibility_crawler'],
    // Added category to satisfy PluginManifest interface requirements
    category: 'service'
  },

  checkIntent: (input: string) => {
    return /(外卖|点餐|饿了|想吃|点个|饭)/.test(input);
  },

  execute: async (input: string, context: any) => {
    const profile = context.profile || MemoryService.getProfile();
    
    if (profile.orderHistory.length === 0) {
      return { 
        step: 'GUIDE_CRAWL', 
        message: "缺失本地画像数据。请同步外卖平台节点。" 
      };
    }

    const currentLat = 39.991;
    const currentLng = 116.482;
    const matchedAddr = MemoryService.matchAddress(currentLat, currentLng);
    const isOffice = matchedAddr?.name.includes('办公') || false;
    
    const cuisineMatch = input.match(/(想吃|点个|要个)(.+)/);
    const targetCuisine = cuisineMatch ? cuisineMatch[2] : (isOffice ? '中式简餐' : '火锅/正餐');

    const recommendations = [
      { 
        name: `${targetCuisine} · ${isOffice ? '职场高效率' : '居家高品质'}`, 
        rating: 4.9, 
        price: `¥${isOffice ? profile.preferences.avgPrice : profile.preferences.avgPrice + 35}`, 
        reason: `关联地点：${matchedAddr?.name}；匹配历史权值：¥${profile.preferences.avgPrice}。`,
        isBest: true,
        cuisine: targetCuisine,
        time: isOffice ? '18min' : '45min',
        platform: '美团外卖'
      },
      { 
        name: `${targetCuisine} · 空间近点`, 
        rating: 4.6, 
        price: `¥${Math.max(15, profile.preferences.avgPrice - 10)}`, 
        reason: '物理距离：最近节点；符合快速就餐权值。',
        cuisine: targetCuisine,
        time: '12min',
        platform: '饿了么'
      }
    ];

    return {
      step: 'QUICK_ORDER',
      address: matchedAddr,
      data: recommendations,
      message: `坐标：${matchedAddr?.name}。${isOffice ? '办公' : '住宅'}模式画像已加载。`
    };
  },

  renderUI: ({ data, onAction }) => {
    if (data.step === 'GUIDE_CRAWL') {
      return (
        <div className="h-full flex flex-col p-8 animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-5 mb-8">
             <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl text-white">
               <Accessibility size={32} />
             </div>
             <div>
                <h4 className="text-lg font-black text-slate-800">建立时空画像</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">Spatial Neural Mapping</p>
             </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-8 flex-1">
             <div className="flex gap-4 mb-6">
                <Info size={20} className="text-blue-500 shrink-0" />
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  通过无障碍服务同步外部节点，校准 <span className="text-blue-600">内核画像</span> 精度。
                </p>
             </div>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><MapPin size={18} className="text-blue-600"/></div>
                  <span className="text-xs text-slate-500 font-black">地理坐标映射</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Utensils size={18} className="text-blue-600"/></div>
                  <span className="text-xs text-slate-500 font-black">消费特征权重同步</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-auto">
            <button 
              onClick={() => onAction('CRAWL_ACCESSIBILITY', 'Meituan')}
              className="w-full py-6 bg-[#FFD000] text-black rounded-[1.8rem] flex items-center justify-between px-8 transition-all active:scale-[0.95] shadow-xl shadow-yellow-500/10 font-black text-sm"
            >
              <div className="flex items-center gap-4">
                <Smartphone size={20} />
                同步美团节点
              </div>
              <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => onAction('CRAWL_ACCESSIBILITY', 'Eleme')}
              className="w-full py-6 bg-[#00A0FF] text-white rounded-[1.8rem] flex items-center justify-between px-8 transition-all active:scale-[0.95] shadow-xl shadow-blue-500/10 font-black text-sm"
            >
              <div className="flex items-center gap-4">
                <Smartphone size={20} />
                同步饿了么节点
              </div>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      );
    }

    if (data.step === 'QUICK_ORDER') {
      return (
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">内核定位节点</p>
                  <h5 className="text-xs font-black text-slate-800 truncate">{data.address?.name || '未定义坐标'}</h5>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/20">
                 <Sparkles size={14} className="text-yellow-600" />
                 <span className="text-[10px] font-black text-yellow-700 uppercase">画像激活</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
            {data.data.map((item: any, i: number) => (
              <div 
                key={i} 
                className={`flex flex-col rounded-[2.8rem] border transition-all overflow-hidden ${
                  item.isBest 
                  ? 'bg-white border-blue-100 shadow-2xl ring-1 ring-blue-50' 
                  : 'bg-slate-50 border-transparent opacity-80'
                }`}
              >
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-base font-black text-slate-900 truncate">{item.name}</h4>
                        {item.isBest && (
                          <span className="bg-blue-600 text-[9px] px-3 py-1 text-white rounded-full font-black uppercase tracking-widest">推荐权值</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold">
                         <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700"><Star size={12} className="fill-current text-yellow-500"/> {item.rating}</span>
                         <span className="flex items-center gap-1.5"><Clock size={12}/> {item.time}</span>
                         <span className={`font-black ${item.platform === '美团外卖' ? 'text-yellow-600' : 'text-blue-500'}`}>{item.platform}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-slate-900 leading-none mb-1">{item.price}</div>
                      <div className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">OS 极速模式</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">{item.reason}</p>
                  </div>
                </div>

                <button 
                  onClick={() => onAction('PLACE_ORDER', item)}
                  className={`w-full py-6 text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-[0.96] flex items-center justify-center gap-3 ${
                    item.isBest 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'bg-white text-slate-400 border-t border-slate-100 hover:text-slate-900'
                  }`}
                >
                  <MousePointer2 size={20} /> 确认以此特征下单
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  }
};
