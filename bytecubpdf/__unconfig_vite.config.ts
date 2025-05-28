
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import path from 'path'

const __unconfig_default =  defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程配置
        entry: 'src/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@/shared': path.resolve(__dirname, './src/shared'),
              '@/main': path.resolve(__dirname, './src/main'),
            }
          },
          build: {
            sourcemap: true,  // 确保主进程启用 sourcemap
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'sqlite3', 'fs', 'path']
            }
          }
        }
      },
      {
        // 预加载脚本配置
        entry: 'src/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron', 'sqlite3', 'fs', 'path']
            }
          }
        }
      }
    ])
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: 'inline'  // 渲染进程启用内联 sourcemap
  },
  resolve: {
    alias: {
      // '@': path.resolve(__dirname, './src/renderer'),
      '@/renderer': path.resolve(__dirname, './src/renderer'),
      '@/main': path.resolve(__dirname, './src/main'),
      '@/preload': path.resolve(__dirname, './src/preload'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
    }
  }
})
if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;