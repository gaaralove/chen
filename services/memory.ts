
import { AppAction, UserProfile, LocationInfo, OrderRecord } from '../types';

const PROFILE_KEY = 'droidmind_profile';

export const MemoryService = {
  getActions: (): AppAction[] => {
    const data = localStorage.getItem('droidmind_memory');
    return data ? JSON.parse(data) : [];
  },

  logAction: (action: Omit<AppAction, 'id' | 'timestamp'>) => {
    const actions = MemoryService.getActions();
    const newAction: AppAction = {
      ...action,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const updated = [newAction, ...actions].slice(0, 100);
    localStorage.setItem('droidmind_memory', JSON.stringify(updated));
    MemoryService.updateProfileFromAction(newAction);
    return newAction;
  },

  getProfile: (): UserProfile => {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
    
    return { 
      tags: [], 
      habits: [], 
      addresses: [],
      preferences: { avgPrice: 0, favoriteCuisines: [], activeTimeRange: 'Any' },
      orderHistory: []
    };
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  /**
   * 核心：地理位置与外卖数据的深度绑定
   */
  injectCrawlData: (platform: 'Meituan' | 'Eleme') => {
    const profile = MemoryService.getProfile();
    
    // 模拟爬取的地理位置（通常来自 App 的地址列表）
    const crawledAddresses: LocationInfo[] = [
      { name: '望京SOHO办公区', lat: 39.99, lng: 116.48, address: '北京市朝阳区望京街', source: platform },
      { name: '龙湖长楹天街住宅区', lat: 39.92, lng: 116.59, address: '北京市朝阳区常营', source: platform }
    ];

    // 模拟爬取的历史订单，并建立地点关联
    const crawledOrders: OrderRecord[] = [
      { id: `O-${Date.now()}-1`, platform, restaurant: '麦当劳(望京店)', amount: 38, timestamp: Date.now() - 86400000, cuisine: '简餐', locationName: '望京SOHO办公区' },
      { id: `O-${Date.now()}-2`, platform, restaurant: '瑞幸咖啡', amount: 19, timestamp: Date.now() - 172800000, cuisine: '咖啡', locationName: '望京SOHO办公区' },
      { id: `O-${Date.now()}-3`, platform, restaurant: '海底捞火锅', amount: 280, timestamp: Date.now() - 259200000, cuisine: '火锅', locationName: '龙湖长楹天街住宅区' },
    ];

    // 更新地址库
    const existingAddrs = new Set(profile.addresses.map(a => a.name));
    crawledAddresses.forEach(a => { if (!existingAddrs.has(a.name)) profile.addresses.push(a); });

    // 更新订单历史
    profile.orderHistory = [...profile.orderHistory, ...crawledOrders].slice(-50);
    
    // 触发画像迭代分析
    MemoryService.iterateProfile(profile);
  },

  iterateProfile: (profile: UserProfile) => {
    const orders = profile.orderHistory;
    if (orders.length === 0) return;

    // 分析地点偏好
    const locationTraits: Record<string, { total: number, counts: Record<string, number> }> = {};
    orders.forEach(o => {
      if (!locationTraits[o.locationName]) locationTraits[o.locationName] = { total: 0, counts: {} };
      locationTraits[o.locationName].total += o.amount;
      locationTraits[o.locationName].counts[o.cuisine] = (locationTraits[o.locationName].counts[o.cuisine] || 0) + 1;
    });

    // 生成动态标签
    const newTags: UserProfile['tags'] = [];
    Object.keys(locationTraits).forEach(loc => {
      const isWork = loc.includes('办公') || loc.includes('SOHO');
      newTags.push({ 
        name: isWork ? '职场高效餐饮' : '居家高品质消费', 
        weight: 85, 
        trend: 'up' 
      });
    });

    const avg = orders.reduce((s, o) => s + o.amount, 0) / orders.length;
    profile.preferences.avgPrice = Math.round(avg);
    profile.tags = newTags;
    
    MemoryService.saveProfile(profile);
  },

  updateProfileFromAction: (action: AppAction) => {
    if (action.metadata?.cuisine) {
      const profile = MemoryService.getProfile();
      profile.preferences.favoriteCuisines = [
        action.metadata.cuisine, 
        ...profile.preferences.favoriteCuisines.filter(c => c !== action.metadata.cuisine)
      ].slice(0, 5);
      MemoryService.saveProfile(profile);
    }
  },

  matchAddress: (lat: number, lng: number): LocationInfo | null => {
    const profile = MemoryService.getProfile();
    if (profile.addresses.length === 0) return null;
    let closest = profile.addresses[0];
    let minDist = Infinity;
    profile.addresses.forEach(addr => {
      const dist = Math.sqrt(Math.pow(addr.lat - lat, 2) + Math.pow(addr.lng - lng, 2));
      if (dist < minDist) { minDist = dist; closest = addr; }
    });
    return closest;
  }
};
