import config from '@/config'
import events from '@/lib/utils/events'
import time from '@/lib/utils/time'
import { nanoid } from 'nanoid'

export default class Tab {
  constructor(untitledLastIndex, inquiry = {}) {
    this.id = inquiry.id || nanoid()
    this.name = inquiry.id ? inquiry.name : null
    this.tempName =
      inquiry.name ||
      (untitledLastIndex
        ? `Untitled ${untitledLastIndex}`
        : 'Untitled')
    this.query = inquiry.query || ''
    this.viewOptions = inquiry.viewOptions || undefined
    this.isPredefined = inquiry.isPredefined
    this.viewType = inquiry.viewType || 'chart'
    this.dataSource = inquiry.dataSource || '1' // 添加dataSource属性
    this.result = null
    this.isGettingResults = false
    this.error = null
    this.time = 0
    this.layout = inquiry.layout || {
      sqlEditor: 'above',
      table: 'bottom',
      dataView: 'hidden'
    }
    this.maximize = inquiry.maximize

    this.isSaved = !!inquiry.id
    this.updatedAt = inquiry.updatedAt
  }

  // 清理方法，用于在不需要Tab实例时释放资源
  destroy() {
    // 清理dataView引用
    if (this.dataView) {
      // 如果dataView有自己的清理方法，调用它
      if (typeof this.dataView.beforeUnmount === 'function') {
        try {
          this.dataView.beforeUnmount()
        } catch (error) {
          console.warn('Error calling dataView beforeUnmount:', error)
        }
      }
      this.dataView = null
    }
    // 清理所有可能导致内存泄漏的属性
    this.result = null
    this.error = null
    this.query = ''
    this.viewOptions = undefined
    this.layout = null
    this.maximize = null
  }

  async execute(dataSource, processedQuery) {
    //console.log('Tab.execute被调用:', dataSource, processedQuery)
    // 彻底清理之前的结果和错误状态，避免内存泄漏
    this.isGettingResults = true
    this.result = null
    this.error = null
    this.time = 0
    try {
      const start = new Date()
      // 确定数据源和查询语句
      let finalDataSource = '1'
      let queryToExecute = this.query
      
      if (processedQuery) {
        // 如果提供了processedQuery，使用它
        queryToExecute = processedQuery
        finalDataSource = dataSource || '1'
      } else if (dataSource && typeof dataSource === 'object') {
        // 兼容新的参数格式
        finalDataSource = dataSource.dataSource || '1'
        queryToExecute = dataSource.query || this.query
      } else {
        // 兼容旧的参数格式
        finalDataSource = dataSource || '1'
      }
      
      console.log('执行的SQL:', queryToExecute)
      console.log('数据源:', finalDataSource)
      
      // 直接使用API调用，避免依赖db对象
      const { baseUrl, apiPrefix, endpoints } = config.backend
      const apiUrl = `${baseUrl}${apiPrefix}/${endpoints.executeSql}`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: queryToExecute + ';',
          params: [],
          ds: finalDataSource
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      
      // Check if API returned an error code
      if (responseData.code !== 200) {
        // Handle specific error codes
        const errorMsg = responseData.msg || '未知错误'
        throw new Error(errorMsg)
      }
      
      // API returns { code: 200, msg: "success", data: [results] }
      // if it was more than one select - take only the last one
      const results = responseData.data || []
      if (results.length > 0) {
        // 只存储最后一个结果，避免存储整个results数组
        const lastResult = results[results.length - 1]
        // 确保结果对象结构简单，避免深层嵌套
        this.result = {
          columns: lastResult.columns || [],
          values: lastResult.values || {},
          error: lastResult.error || null
        }
      }
      this.time = time.getPeriod(start, new Date())

      if (this.result && this.result.values && Object.keys(this.result.values).length > 0) {
        // 获取结果集大小，但不存储整个结果集
        const firstColumn = this.result.columns[0]
        const rowCount = firstColumn ? (this.result.values[firstColumn] ? this.result.values[firstColumn].length : 0) : 0
        events.send(
          'resultset.create',
          rowCount
        )
      }

      events.send('query.run', parseFloat(this.time), { status: 'success' })
      console.log('查询执行成功')
    } catch (err) {
      // 存储错误信息时避免创建深层对象
      this.error = {
        type: 'error',
        message: err.message || String(err)
      }
      console.error('查询执行失败:', err)

      events.send('query.run', 0, { status: 'error' })
    } finally {
      this.isGettingResults = false
    }
  }
}
