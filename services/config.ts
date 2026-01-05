
/**
 * DroidMind 全局环境配置
 * 二次开发说明：
 * 1. 生产环境建议将 API_KEY 存储在混淆后的 Native 层通过 Bridge 获取
 * 2. APP_VERSION 需与安卓清单文件保持一致
 */
export const APP_CONFIG = {
  APP_NAME: "DroidMind AI",
  VERSION: "1.0.0-PRO",
  // 模拟原生安卓 Bridge 检查
  IS_NATIVE: typeof (window as any).Android !== 'undefined',
  DEFAULT_LLM: 'gemini-3-flash-preview',
  MAX_MEMORY_HISTORY: 50,
  ACCESSIBILITY_TIMEOUT: 2000,
};

/**
 * 模拟原生安卓能力调用接口
 * 如果在 WebView 中运行，会自动尝试调用原生 inject 进来的对象
 */
export const AndroidBridge = {
  vibrate: (ms: number) => {
    if ((window as any).Android?.vibrate) (window as any).Android.vibrate(ms);
    else if (navigator.vibrate) navigator.vibrate(ms);
  },
  showToast: (msg: string) => {
    if ((window as any).Android?.showToast) (window as any).Android.showToast(msg);
    else alert(msg);
  },
  // 核心：无障碍服务跳转
  openAccessibilitySettings: () => {
    if ((window as any).Android?.openSettings) (window as any).Android.openSettings('accessibility');
    else console.log("请在安卓设置中手动开启无障碍服务");
  }
};
