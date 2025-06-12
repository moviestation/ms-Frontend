import { createRouter, createWebHashHistory } from 'vue-router'
import { configureNProgress } from '@/api/nprogress'
import { useAuthStore } from '@/stores'

// Nprogress
configureNProgress()

// Router
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior(to: any, from: any, savedPosition: any) {
    // 如果页面有缓存那么恢复其位置, 否则始终滚动到顶部
    if (to.meta.keepAlive && savedPosition) return savedPosition
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/dashboard' },
    {
      path: '/',
      component: () => import('../layouts/default.vue'),
      children: [
        {
          path: '/dashboard',
          component: () => import('../pages/dashboard.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/recommend',
          component: () => import('../pages/recommend.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/discover',
          component: () => import('../pages/discover.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/resource',
          component: () => import('../pages/resource.vue'),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: '/subscribe/movie',
          component: () => import('../pages/subscribe.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
            subType: '电影',
          },
        },
        {
          path: '/subscribe/tv',
          component: () => import('../pages/subscribe.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
            subType: '电视剧',
          },
        },
        {
          path: '/workflow',
          component: () => import('../pages/workflow.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/calendar',
          component: () => import('../pages/calendar.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/downloading',
          component: () => import('../pages/downloading.vue'),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: '/history',
          component: () => import('../pages/history.vue'),
          meta: {
            requiresAuth: true,
            hideFooter: true,
          },
        },
        {
          path: '/site',
          component: () => import('../pages/site.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/user',
          component: () => import('../pages/user.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/profile',
          component: () => import('../pages/profile.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/plugins',
          component: () => import('../pages/plugin.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/setting',
          component: () => import('../pages/setting.vue'),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: '/browse/:paths+',
          component: () => import('../pages/browse.vue'),
          props: true,
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/credits/:paths+',
          component: () => import('../pages/credits.vue'),
          props: true,
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/person',
          component: () => import('../pages/person.vue'),
          props: true,
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/media',
          component: () => import('../pages/media.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
          },
        },
        {
          path: '/filemanager',
          component: () => import('../pages/filemanager.vue'),
          meta: {
            keepAlive: true,
            requiresAuth: true,
            hideFooter: true,
          },
        },
        {
          path: '/apps',
          component: () => import('../pages/appcenter.vue'),
          meta: {
            requiresAuth: true,
          },
        },
      ],
    },
    {
      path: '/',
      component: () => import('../layouts/blank.vue'),
      children: [
        {
          path: 'login',
          component: () => import('../pages/login.vue'),
        },
        {
          path: '/:pathMatch(.*)*',
          component: () => import('../pages/[...all].vue'),
        },
      ],
    },
  ],
})

const abortControllers = new Set<AbortController>()

// 注册中止控制器
function registerAbortController(controller: AbortController) {
  abortControllers.add(controller)
}

// 中止所有组件的任务
function abortAllControllers() {
  for (const controller of abortControllers) {
    controller.abort()
  }
  abortControllers.clear()
}

// 路由导航守卫
router.beforeEach((to: any, from: any, next: any) => {
  // 认证 Store
  const authStore = useAuthStore()
  // 总是记录非login路由
  if (to.fullPath != '/login') authStore.originalPath = to.fullPath
  const isAuthenticated = authStore.token !== null
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    abortAllControllers()
    next()
  }
})

// 导出默认对象
export default router
// 另行导出其他功能
export { registerAbortController }
