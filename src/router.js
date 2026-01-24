import { createRouter, createWebHashHistory } from 'vue-router'
import Workspace from '@/views/Workspace'
import Inquiries from '@/views/Inquiries'
import Welcome from '@/views/Welcome'
import MainView from '@/views/MainView'
import LoadView from '@/views/LoadView'
import store from '@/store'
import database from '@/lib/database'

export const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome
  },
  {
    path: '/',
    name: 'MainView',
    component: MainView,
    children: [
      {
        path: '/workspace',
        name: 'Workspace',
        component: Workspace
      },
      {
        path: '/inquiries',
        name: 'Inquiries',
        component: Inquiries
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
