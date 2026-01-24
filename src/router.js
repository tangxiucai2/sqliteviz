import database from '@/lib/database'
import store from '@/store'
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
  if (!store.state.db && to.name !== 'Load') {
    const newDb = database.getNewDatabase()
    await newDb.loadDb()
    store.commit('setDb', newDb)
  }
  
  // Handle share URL
  const shareParam = new URLSearchParams(window.location.hash.slice(1)).get('share')
  if (shareParam) {
    // Check if we already have a tab with this share ID
    const hasShareTab = store.state.tabs.some(tab => 
      (tab.isSaved && tab.inquiryId === shareParam) || 
      tab.shareId === shareParam
    )
    
    if (!hasShareTab) {
      // Look for saved inquiry with this ID
      const savedInquiry = store.state.inquiries.find(inquiry => inquiry.id === shareParam)
      
      let tabConfig
      if (savedInquiry) {
        // Use saved inquiry
        tabConfig = {
          query: savedInquiry.query,
          name: savedInquiry.name,
          isSaved: true,
          inquiryId: savedInquiry.id
        }
      } else {
        // For random share IDs, we don't have the query yet
        // We'll just create a placeholder tab for now
        tabConfig = {
          name: `Shared Query: ${shareParam}`,
          query: `-- Shared query with ID: ${shareParam}`,
          shareId: shareParam
        }
      }
      
      // Add the tab
      const tabId = await store.dispatch('addTab', tabConfig)
      store.commit('setCurrentTabId', tabId)
      
      // Navigate to workspace
      next({ name: 'Workspace' })
      return
    }
  }
  
  next()
})

export default router
