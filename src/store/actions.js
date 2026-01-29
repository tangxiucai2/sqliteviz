import { config } from '@/config'
import Tab from '@/lib/tab'
import { nanoid } from 'nanoid'

const { baseUrl, apiPrefix, endpoints } = config.backend
const buildUrl = (path) => `${baseUrl}${apiPrefix}/${path}`

export default {
  async addTab({ state }, inquiry = {}) {
    // add new tab only if it was not already opened
    if (!state.tabs.some(openedTab => openedTab.id === inquiry.id)) {
      const tab = new Tab(state, JSON.parse(JSON.stringify(inquiry)))
      state.tabs.push(tab)
      if (!tab.name) {
        state.untitledLastIndex += 1
      }
      return tab.id
    }

    return inquiry.id
  },
  async saveInquiry({ state }, { inquiryTab, newName }) {
    const value = {
      id: inquiryTab.type === 'system' || newName ? nanoid() : inquiryTab.id,
      query: inquiryTab.query,
      viewType: inquiryTab.dataView.mode,
      viewOptions: inquiryTab.dataView.getOptionsForSave(),
      name: newName || inquiryTab.name,
      updatedAt: new Date().toJSON(),
      type: 'custom', // 自定义类型
      category: inquiryTab.category || '默认类别' // 默认类别
    }

    try {
      // 调用后端API保存查询
      const response = await fetch(buildUrl(endpoints.inquiries.list), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      })
      
      if (!response.ok) {
        throw new Error(`保存查询失败: ${response.status}`)
      }
      
      const savedInquiry = await response.json()
      
      // 更新本地状态
      const myInquiries = state.inquiries
      const inquiryIndex = myInquiries.findIndex(
        oldInquiry => oldInquiry.id === savedInquiry.id
      )
      
      if (inquiryIndex === -1) {
        myInquiries.push(savedInquiry)
      } else {
        myInquiries.splice(inquiryIndex, 1, savedInquiry)
      }
      
      return savedInquiry
    } catch (error) {
      console.error('Error saving inquiry:', error)
      // 失败时降级使用本地存储
      const myInquiries = state.inquiries
      let inquiryIndex
      
      // Set createdAt
      if (newName) {
        value.createdAt = new Date().toJSON()
      } else {
        inquiryIndex = myInquiries.findIndex(
          oldInquiry => oldInquiry.id === inquiryTab.id
        )
        
        value.createdAt =
          inquiryIndex !== -1
            ? myInquiries[inquiryIndex].createdAt
            : new Date().toJSON()
      }
      
      // Insert in inquiries list
      if (newName || inquiryIndex === -1) {
        myInquiries.push(value)
      } else {
        myInquiries.splice(inquiryIndex, 1, value)
      }
      
      return value
    }
  },
  
  async addInquiry({ state }, newInquiry) {
    try {
      // 调用后端API添加查询
      const response = await fetch(buildUrl(endpoints.inquiries.list), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newInquiry)
      })
      
      if (!response.ok) {
        throw new Error(`添加查询失败: ${response.status}`)
      }
      
      const addedInquiry = await response.json()
      state.inquiries.push(addedInquiry)
      return addedInquiry
    } catch (error) {
      console.error('Error adding inquiry:', error)
      // 失败时降级使用本地存储
      state.inquiries.push(newInquiry)
      return newInquiry
    }
  },
  
  async deleteInquiries({ state, commit }, inquiryIdSet) {
    try {
      // 调用后端API删除查询
      const response = await fetch(buildUrl(endpoints.inquiries.delete), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryIds: Array.from(inquiryIdSet)
        })
      })
      
      if (!response.ok) {
        throw new Error(`删除查询失败: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting inquiries:', error)
    }
    
    // 更新本地状态
    state.inquiries = state.inquiries.filter(
      inquiry => !inquiryIdSet.has(inquiry.id)
    )

    // Close deleted inquiries if it was opened
    const tabs = state.tabs
    let i = tabs.length - 1
    while (i > -1) {
      if (inquiryIdSet.has(tabs[i].id)) {
        commit('deleteTab', tabs[i])
      }
      i--
    }
  },
  
  async renameInquiry({ state, commit }, { inquiryId, newName }) {
    try {
      // 调用后端API重命名查询
      const response = await fetch(buildUrl(endpoints.inquiries.rename), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryId,
          newName
        })
      })
      
      if (!response.ok) {
        throw new Error(`重命名查询失败: ${response.status}`)
      }
    } catch (error) {
      console.error('Error renaming inquiry:', error)
    }
    
    // 更新本地状态
    const renamingInquiry = state.inquiries.find(
      inquiry => inquiry.id === inquiryId
    )

    if (renamingInquiry) {
      renamingInquiry.name = newName
      
      // update tab, if renamed inquiry is opened
      const tab = state.tabs.find(tab => tab.id === renamingInquiry.id)
      if (tab) {
        commit('updateTab', {
          tab,
          newValues: {
            name: newName
          }
        })
      }
    }
  }
}
