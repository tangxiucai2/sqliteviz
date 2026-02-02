import events from '@/lib/utils/events'
import time from '@/lib/utils/time'
import { nanoid } from 'nanoid'

export default class Tab {
  constructor(state, inquiry = {}) {
    this.id = inquiry.id || nanoid()
    this.name = inquiry.id ? inquiry.name : null
    this.tempName =
      inquiry.name ||
      (state.untitledLastIndex
        ? `Untitled ${state.untitledLastIndex}`
        : 'Untitled')
    this.query = inquiry.query || ''
    this.viewOptions = inquiry.viewOptions || undefined
    this.isPredefined = inquiry.isPredefined
    this.viewType = inquiry.viewType || 'chart'
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
    this.state = state
    this.updatedAt = inquiry.updatedAt
  }

  async execute(dataSource, processedQuery) {
    console.log('Tab.execute被调用:', dataSource, processedQuery)
    this.isGettingResults = true
    this.result = null
    this.error = null
    const db = this.state.db
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
      
      if (!db) {
        throw new Error('数据库未初始化')
      }
      
      this.result = await db.execute(queryToExecute + ';', finalDataSource)
      this.time = time.getPeriod(start, new Date())

      if (this.result && this.result.values) {
        events.send(
          'resultset.create',
          this.result.values[this.result.columns[0]].length
        )
      }

      events.send('query.run', parseFloat(this.time), { status: 'success' })
      console.log('查询执行成功')
    } catch (err) {
      this.error = {
        type: 'error',
        message: err
      }
      console.error('查询执行失败:', err)

      events.send('query.run', 0, { status: 'error' })
    }
    this.isGettingResults = false
  }
}
