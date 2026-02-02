import Dashboard from '@/views/Dashboard'
import Inquiries from '@/views/Inquiries'
import LoadView from '@/views/LoadView'
import MainView from '@/views/MainView'
import Welcome from '@/views/Welcome'
import Workspace from '@/views/Workspace'
import { createRouter, createWebHashHistory } from 'vue-router'

export const routes = [
  // 数据引用：对应导入csv、json功能页面
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  // 数据引用的另一个入口，方便外部应用直接访问
  {
    path: '/data-reference',
    name: 'DataReference',
    component: Welcome
  },
  {
    path: '/',
    name: 'MainView',
    component: MainView,
    children: [
      // 自定义报表：对应打开sql编辑器界面
      {
        path: '/workspace',
        name: 'Workspace',
        component: Workspace
      },
      // 数据报表管理：对应“查询”功能菜单
      {
        path: '/inquiries',
        name: 'Inquiries',
        component: Inquiries
      },
      // 仪表板：对应仪表板功能
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      // 数据报表管理的另一个入口，方便外部应用直接访问
      {
        path: '/report-management',
        name: 'ReportManagement',
        component: Inquiries
      },
      // 自定义报表的另一个入口，方便外部应用直接访问
      {
        path: '/custom-report',
        name: 'CustomReport',
        component: Workspace
      }
    ]
  },
  {
    path: '/load',
    name: 'Load',
    component: LoadView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // 简化路由守卫，移除数据库初始化和分享功能
  next()
})

export default router
