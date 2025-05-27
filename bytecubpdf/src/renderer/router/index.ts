import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import PdfTranslateView from '@/renderer/views/PdfTranslateView.vue'
import SettingsView from '@/renderer/views/SettingsView.vue'
import AboutView from '@/renderer/views/AboutView.vue'
import ModelSettings from  '@/renderer/components/settings/ModelSettings.vue'
// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'PdfTranslate',
    component: PdfTranslateView,
    meta: {
      title: '首页'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
    children: [
      {
        path: '', // 默认子路由
        redirect: { name: 'ModelSettings' }
      },
      {
        path: 'model',
        name: 'ModelSettings',
        component: ModelSettings,
        meta: {
          title: '大模型设置'
        },
        props: (route) => ({  // 添加props传递
          platformId: route.params.platformId
        })
      }
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
    meta: {
      title: '关于'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  console.log(`路由从 ${from.path} 跳转到 ${to.path}`)
  next()
})

// 全局后置钩子
router.afterEach((to) => {
  // 可以在这里设置页面标题
  document.title = to.meta.title ? `${to.meta.title} | 小书芽` : '小书芽'
})

export default router