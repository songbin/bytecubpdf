import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

// ✨ 改为懒加载：只在访问路由时才加载对应组件
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'HomeIndex',
    component: () => import('@/renderer/views/HomeIndexView.vue'),
    meta: {
      title: '主页',
      keepAlive: false
    }
  },
  {
    path: '/chat',
    name: 'MainChat',
    component: () => import('@/renderer/views/MainChatView.vue'),
    meta: {
      title: '聊天',
      keepAlive: true
    }
  },
  {
    path: '/pdf',
    name: 'PdfTranslate',
    component: () => import('@/renderer/views/PdfTranslateView.vue'),
    meta: {
      title: '首页',
      keepAlive: true
    }
  },

  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/renderer/views/SettingsView.vue'),
    children: [
      {
        path: '',
        redirect: { name: 'ModelSettings' }
      },
      {
        path: 'model',
        name: 'ModelSettings',
        component: () => import('@/renderer/components/settings/ModelSettings.vue'),
        meta: {
          title: '大模型设置',
          keepAlive: true,
        },
        props: (route) => ({
          platformId: route.params.platformId
        })
      },
      {
        path: 'assistant',
        name: 'AssistantSettings',
        component: () => import('@/renderer/components/settings/AssistantSettings.vue'),
        meta: {
          title: '助手设置',
          keepAlive: true,
        },
        props: (route) => ({
          assistantId: route.params.assistantId
        })
      }
    ]
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/renderer/views/AboutView.vue'),
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