import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from '../shared/i18n'
import { LogLevel } from '@/shared/constants/dfconstants'
// import ElementPlusX from 'vue-element-plus-x'


 
// 初始化日志系统
if ((window as any).window.electronAPI) {
  // 覆盖console方法
  const originalConsole = { ...console };
  
  (window as any).window.electronAPI?.log(LogLevel.INFO, 'Renderer process started');
  
  // 重写console方法
  ['log', 'info', 'warn', 'error'].forEach(method => {
    const typedMethod = method as keyof Console;  // 添加类型断言和变量声明
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
const app = createApp(App)
app.use(i18n) // 引入i18n,必须在use router之前
app.use(router)
// app.use(ElementPlusX)
app.mount('#app')