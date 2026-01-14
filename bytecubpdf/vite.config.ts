import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
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
            sourcemap: true,
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
    sourcemap: 'inline',
    // ✨ 新增：代码分割配置
    rollupOptions: {
      output: {
        // 手动分包策略
        manualChunks: (id) => {
          // 将 node_modules 中的包进行分包
          if (id.includes('node_modules')) {
            // Vue 核心单独打包
            if (id.includes('vue') && id.includes('node_modules/vue')) {
              return 'vue-core'
            }
            // Pinia 单独打包
            if (id.includes('pinia')) {
              return 'pinia'
            }
            // @vue 相关库单独打包
            if (id.includes('@vue')) {
              return 'vue-utils'
            }
            // vue-router 单独打包
            if (id.includes('vue-router')) {
              return 'router'
            }
            // naive-ui 单独打包
            if (id.includes('naive-ui')) {
              return 'naive-ui'
            }
            // PDF 相关库单独打包
            if (id.includes('pdfjs') || id.includes('pdf')) {
              return 'pdf-vendor'
            }
            // i18n 相关库单独打包
            if (id.includes('i18n') || id.includes('vue-i18n')) {
              return 'i18n'
            }
            // 其他第三方库打包到 vendor
            return 'vendor'
          }
        }
      }
    },
    // ✨ 新增：chunk 大小警告阈值（KB）
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@/renderer': path.resolve(__dirname, './src/renderer'),
      '@/main': path.resolve(__dirname, './src/main'),
      '@/preload': path.resolve(__dirname, './src/preload'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
    }
  },
  // ✨ 新增：优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'naive-ui'
    ],
    exclude: [
      // PDF.js 不预构建，按需加载
      'pdfjs-dist'
    ]
  },
  // ✨ 新增：CSS 配置，抑制字体解析警告
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // 使用现代编译器，避免 legacy 警告
      }
    }
  },
  // 静态资源处理配置
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf']
})