import { nanoid } from 'nanoid'
import fu from '@/lib/utils/fileIo'
import events from '@/lib/utils/events'
import migration from './_migrations'
import { config } from '@/config'

const migrate = migration._migrate
const { baseUrl, apiPrefix, endpoints } = config.backend
const buildUrl = (path) => `${baseUrl}${apiPrefix}/${path}`

export default {
  version: 2,
  
  // 获取查询报表列表
  async getStoredInquiries() {
    try {
      const response = await fetch(buildUrl(endpoints.inquiries.list), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inquiries: ${response.status}`)
      }
      
      const data = await response.json()
      return data.inquiries || []
    } catch (error) {
      console.error('Error fetching inquiries:', error)
      return []
    }
  },

  // 复制查询报表
  async duplicateInquiry(baseInquiry) {
    try {
      const response = await fetch(buildUrl(endpoints.inquiries.copy), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryId: baseInquiry.id
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to copy inquiry: ${response.status}`)
      }
      
      const data = await response.json()
      return data.inquiry
    } catch (error) {
      console.error('Error copying inquiry:', error)
      // 失败时使用本地复制作为降级方案
      const newInquiry = JSON.parse(JSON.stringify(baseInquiry))
      newInquiry.name = newInquiry.name + ' Copy'
      newInquiry.id = nanoid()
      newInquiry.createdAt = new Date().toJSON()
      newInquiry.updatedAt = new Date().toJSON()
      newInquiry.type = 'custom' // 自定义类型
      newInquiry.category = '默认类别' // 默认类别
      delete newInquiry.isPredefined
      
      return newInquiry
    }
  },

  isTabNeedName(inquiryTab) {
    return inquiryTab.type === 'system' || !inquiryTab.name
  },

  // 更新查询报表存储
  async updateStorage(inquiries) {
    // 不再使用本地存储，改为后端API调用
    console.log('Inquiry storage is managed by backend API')
  },

  serialiseInquiries(inquiryList) {
    const preparedData = JSON.parse(JSON.stringify(inquiryList))
    return JSON.stringify(
      { version: this.version, inquiries: preparedData },
      null,
      4
    )
  },

  deserialiseInquiries(str) {
    const inquiries = JSON.parse(str)
    let inquiryList = []
    if (!inquiries.version) {
      // Turn data into array if they are not
      inquiryList = !Array.isArray(inquiries) ? [inquiries] : inquiries
      inquiryList = migrate(1, inquiryList)
    } else {
      inquiryList = inquiries.inquiries || []
    }
    
    // 为导入的查询设置默认值
    inquiryList.forEach(inquiry => {
      if (!inquiry.type) {
        inquiry.type = 'custom'
      }
      if (!inquiry.category) {
        inquiry.category = '默认类别'
      }
      delete inquiry.isPredefined
    })

    return inquiryList
  },

  // 导入查询报表
  async importInquiries() {
    return fu.importFile().then(str => {
      const inquires = this.deserialiseInquiries(str)
      
      // 这里可以添加导入到后端的逻辑
      // 暂时先返回导入的数据，由调用方处理
      
      events.send('inquiry.import', inquires.length)
      return inquires
    })
  },
  
  // 导出查询报表
  async export(inquiryList, fileName) {
    try {
      // 先尝试使用后端API导出
      const response = await fetch(buildUrl(endpoints.inquiries.export), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryIds: inquiryList.map(inquiry => inquiry.id)
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        fu.exportBlobToFile(blob, fileName)
      } else {
        // 失败时使用本地导出作为降级方案
        const jsonStr = this.serialiseInquiries(inquiryList)
        fu.exportToFile(jsonStr, fileName)
      }
    } catch (error) {
      console.error('Error exporting inquiries:', error)
      // 失败时使用本地导出作为降级方案
      const jsonStr = this.serialiseInquiries(inquiryList)
      fu.exportToFile(jsonStr, fileName)
    }
    
    events.send('inquiry.export', inquiryList.length)
  },

  async readPredefinedInquiries() {
    // 预定义查询现在由后端返回，包含在getStoredInquiries中
    return []
  }
}
