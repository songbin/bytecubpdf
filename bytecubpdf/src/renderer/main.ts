import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from '../shared/i18n'
import { LogLevel } from '@/shared/constants/dfconstants'
import { createPinia } from 'pinia'

// ✨ 移除顶部的PDF.js导入，改为按需加载
// import * as pdfjsLib from "pdfjs-dist";
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
//   import.meta.url
// ).href;

/**
 * ✨ 按需加载PDF.js
 * 只在访问PDF相关页面时才加载
 */
let pdfJsLoaded = false;
async function loadPdfJs() {
  // 如果已经加载过，直接返回
  if (pdfJsLoaded) {
    return;
  }

  // 检查当前路由是否需要PDF功能
  if (!window.location.hash.includes('/pdf')) {
    return;
  }

  try {
    console.log('📄 [按需加载] 开始加载PDF.js...');
    const loadStart = Date.now();

    // 动态导入PDF.js
    const pdfjsLib = await import('pdfjs-dist');

    // 配置worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).href;

    pdfJsLoaded = true;
    const loadTime = Date.now() - loadStart;
    console.log(`✅ [按需加载] PDF.js加载完成 (${loadTime}ms)`);
  } catch (error) {
    console.error('❌ [按需加载] PDF.js加载失败:', error);
  }
}

// 初始化日志系统
if ((window as any).window.electronAPI) {
  // 覆盖console方法
  const originalConsole = { ...console };

  (window as any).window.electronAPI?.log(LogLevel.INFO, 'Renderer process started');

  // 重写console方法
  ['log', 'info', 'warn', 'error'].forEach(method => {
    const typedMethod = method as keyof Console;
    const original = originalConsole[typedMethod];
    (console[typedMethod] as any) = (...args: any[]) => {
      Function.prototype.apply.call(original, console, args);
      (window as any).window.electronAPI?.log(
        method === 'error' ? LogLevel.ERROR :
        method === 'warn' ? LogLevel.WARN :
        LogLevel.INFO,
        args.map(arg => {
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Circular]';
          }
        }).join(' ')
      );
    };
  });
}

// 创建Vue应用
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(i18n) // 引入i18n,必须在use router之前
app.use(router)
app.mount('#app')

// ✨ 监听路由变化，按需加载PDF.js
router.afterEach((to) => {
  // 如果访问PDF页面，加载PDF.js
  if (to.path === '/pdf' || to.path.startsWith('/pdf')) {
    loadPdfJs().catch(err => {
      console.error('PDF.js加载失败:', err);
    });
  }
});

// ✨ 首次加载时检查是否需要PDF.js
if (window.location.hash.includes('/pdf')) {
  loadPdfJs().catch(err => {
    console.error('PDF.js加载失败:', err);
  });
}