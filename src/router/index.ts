import { createRouter, createWebHashHistory } from 'vue-router'

const TITLES: Record<string, string> = {
  '/': 'DevToolbox',
  '/json-viewer': 'JSON 查看器',
  '/diff': '文本对比',
  '/sql-formatter': 'SQL 格式化',
  '/list-formatter': '列值拼接',
  '/timestamp': '时间戳转换',
  '/password': '密码生成器',
  '/color': '颜色转换',
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/json-viewer',
      name: 'json-viewer',
      component: () => import('@/views/JsonViewer.vue'),
    },
    {
      path: '/diff',
      name: 'diff',
      component: () => import('@/views/DiffTool.vue'),
    },
    {
      path: '/sql-formatter',
      name: 'sql-formatter',
      component: () => import('@/views/SqlFormatter.vue'),
    },
    {
      path: '/list-formatter',
      name: 'list-formatter',
      component: () => import('@/views/ListTool.vue'),
    },
    {
      path: '/timestamp',
      name: 'timestamp',
      component: () => import('@/views/TimestampTool.vue'),
    },
    {
      path: '/password',
      name: 'password',
      component: () => import('@/views/PasswordTool.vue'),
    },
    {
      path: '/color',
      name: 'color',
      component: () => import('@/views/ColorTool.vue'),
    },
  ],
})

router.afterEach((to) => {
  const title = TITLES[to.path]
  document.title = title ? `${title} - DevToolbox` : 'DevToolbox'
})

export default router
