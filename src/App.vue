<template>
  <div id="app" :data-embedded="isEmbeddedMode">
    <router-view />
  </div>
</template>

<script>
import config from '@/config';
import storedInquiries from '@/lib/storedInquiries';

export default {
  // 优化：使用缓存减少重复计算
  provide() {
    return {
      isEmbeddedMode: this.isEmbeddedMode
    }
  },
  computed: {
    inquiries() {
      return this.$store.state.inquiries
    },
    dashboards() {
      return this.$store.state.dashboards
    },
    isEmbeddedMode() {
      return new URLSearchParams(window.location.search).get('embedded') === '1'
    }
  },
  watch: {
    inquiries: {
      deep: true,
      handler() {
        storedInquiries.updateStorage(this.inquiries)
      }
    },
    dashboards: {
      deep: true,
      handler() {
        localStorage.setItem('sqliteviz_dashboards', JSON.stringify(this.dashboards))
      }
    }
  },
  created() {
    // 嵌入模式下清理现有标签页，避免内存泄漏
    if (this.isEmbeddedMode) {
      // 确保在创建新标签页之前清理所有现有标签页
      this.$store.commit('clearTabs')
    }
    
    // 非嵌入模式下才加载存储的查询
    if (!this.isEmbeddedMode) {
      this.$store.commit('setInquiries', storedInquiries.getStoredInquiries())
    }
    
    // 加载存储的仪表板数据
    const storedDashboards = localStorage.getItem('sqliteviz_dashboards')
    if (storedDashboards) {
      try {
        this.$store.commit('setDashboards', JSON.parse(storedDashboards))
      } catch (e) {
        console.error('Failed to parse stored dashboards:', e)
      }
    }
    
    // 检查是否为嵌入模式，并且有报表ID参数
    if (this.isEmbeddedMode) {
      const urlParams = new URLSearchParams(window.location.search)
      const reportId = urlParams.get('id')
      const dsParam = urlParams.get('ds')
      if (reportId) {
        console.log('检测到报表ID:', reportId)
        console.log('检测到数据源参数ds:', dsParam)
        this.loadReportTemplate(reportId, dsParam)
      }
    }
    
    // 添加storage事件监听器
    this.storageEventListener = event => {
      // 非嵌入模式下才响应存储事件
      if (!this.isEmbeddedMode) {
        if (event.key === storedInquiries.myInquiriesKey) {
          this.$store.commit('setInquiries', storedInquiries.getStoredInquiries())
        }
      }
      if (event.key === 'sqliteviz_dashboards') {
        try {
          this.$store.commit('setDashboards', JSON.parse(event.newValue || '[]'))
        } catch (e) {
          console.error('Failed to parse stored dashboards from storage event:', e)
        }
      }
    }
    addEventListener('storage', this.storageEventListener)
  },
  
  beforeUnmount() {
    // 移除storage事件监听器，避免内存泄漏
    if (this.storageEventListener) {
      removeEventListener('storage', this.storageEventListener)
      this.storageEventListener = null
    }
    
    // 清理标签页，避免内存泄漏
    this.$store.commit('clearTabs')
    
    // 清理数据库实例
    this.$store.commit('clearDb')
    
    // 清理状态
    this.$store.commit('setDashboards', [])
    this.$store.commit('setInquiries', [])
    
    // 清理其他可能的状态
    this.$store.state.currentTabId = null
    this.$store.state.currentTab = null
    this.$store.state.untitledLastIndex = 0
  },
  methods: {
    async loadReportTemplate(reportId) {
      let templateData = null
      let template = null
      try {
        console.log('加载报表模板:', reportId)
        // 调用后端接口获取报表模板
        const { baseUrl, apiPrefix } = config.backend
        const apiUrl = `${baseUrl}${apiPrefix}/infra/report/${reportId}`
        console.log('API地址:', apiUrl)
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.code === 200 && data.data && data.data.template) {
            templateData = data.data.template
            console.log('报表模板内容:', templateData)
            
            // 如果template是字符串，解析为对象
            if (typeof templateData === 'string') {
              try {
                templateData = JSON.parse(templateData)
               // console.log('解析后的模板对象:', templateData)
              } catch (error) {
                console.error('解析模板字符串失败:', error)
                templateData = null
              }
            }
            
            if (templateData) {
              // 从inquiries数组中获取第一个元素作为实际的模板数据
              template = templateData
              if (templateData.version && templateData.inquiries && templateData.inquiries.length > 0) {
                template = templateData.inquiries[0]
                console.log('从inquiries数组中获取模板:', template)
                console.log('inquiries模板类型:', template.viewType)
              } else {
                console.log('直接使用templateData作为模板:', templateData)
                console.log('templateData模板类型:', templateData.viewType)
              }
              
              if (template && template.query) {
                console.log('最终模板对象:', template)
                console.log('最终模板类型:', template.viewType)
                // 处理SQL查询语句，添加LIMIT子句
                let processedQuery = template.query.trim()
                
                // 根据行数限制处理SQL
                if (template.rowLimit !== 'unlimited') {
                  let limitValue
                  
                  if (template.rowLimit === 'custom') {
                    // 检查自定义行数是否有效
                    const customLimit = parseInt(template.customRowLimit)
                    if (!isNaN(customLimit) && customLimit >= 1) {
                      limitValue = customLimit
                    }
                  } else {
                    limitValue = parseInt(template.rowLimit)
                  }
                  
                  if (limitValue) {
                    // 检查SQL是否已经包含LIMIT子句
                    if (!processedQuery.toLowerCase().includes('limit')) {
                      // 移除末尾的分号（如果有）
                      if (processedQuery.endsWith(';')) {
                        processedQuery = processedQuery.slice(0, -1)
                      }
                      // 添加LIMIT子句
                      processedQuery += ` LIMIT ${limitValue}`
                    }
                  }
                }
                
                console.log('处理后的查询:', processedQuery)
                
                // 根据viewType设置布局
                let layout
                if (template.viewType === 'table') {
                  // 表格视图，显示表格
                  layout = {
                    sqlEditor: 'above',
                    table: 'bottom',
                    dataView: 'hidden'
                  }
                } else {
                  // 图表视图，显示数据视图
                  layout = {
                    sqlEditor: 'above',
                    table: 'hidden',
                    dataView: 'bottom'
                  }
                }
                
                // 确定数据源，只使用模板中的dataSource值
                const finalDataSource = template.dataSource || '1'
                console.log('最终数据源:', finalDataSource)
                
                // 保存模板信息用于日志
                const templateViewType = template.viewType || 'unknown'
                const templateViewOptions = template.viewOptions || 'unknown'
                console.log('保存的模板类型:', templateViewType)
                console.log('保存的模板选项:', templateViewOptions)
                
                // 创建新标签页，设置布局
                this.$store.dispatch('addTab', {
                  query: template.query,
                  name: template.name || '报表',
                  viewType: template.viewType || 'chart',
                  viewOptions: template.viewOptions || {
                    data: [],
                    layout: {
                      autosize: true,
                      mapbox: {
                        style: "open-street-map"
                      },
                      showlegend: true
                    },
                    frames: []
                  },
                  rowLimit: template.rowLimit || '100',
                  customRowLimit: template.customRowLimit,
                  dataSource: finalDataSource,
                  layout: layout
                }).then(tabId => {
                  console.log('创建标签页成功:', tabId)
                  this.$store.commit('setCurrentTabId', tabId)
                  
                  // 等待新标签页创建完成
                  setTimeout(() => {
                    // 获取新标签页
                    const newTab = this.$store.state.tabs.find(
                      tab => tab.id === tabId
                    )
                    
                    if (newTab) {
                      // 在新标签页中执行查询
                      newTab.execute(finalDataSource, processedQuery).then(() => {
                        
                        // 清理模板数据，避免内存泄漏
                        templateData = null
                        template = null
                        
                        // 等待查询结果处理完成
                        setTimeout(() => {
                          // 检查新标签页的查询结果
                          if (newTab.result && newTab.result.values) {
                            //console.log('新标签页查询结果:', newTab.result)
                            console.log('结果集列数:', newTab.result.columns.length)
                            console.log('结果集行数:', newTab.result.values[newTab.result.columns[0]].length)
                            console.log('图表类型:', templateViewType)
                            console.log('图表选项:', templateViewOptions)
                          } else {
                            console.error('新标签页查询结果为空或格式不正确')
                          }
                        }, 1000)
                      }).catch(error => {
                        console.error('新标签页查询执行失败:', error)
                        // 清理模板数据，避免内存泄漏
                        templateData = null
                        template = null
                      })
                    } else {
                      // 清理模板数据，避免内存泄漏
                      templateData = null
                      template = null
                    }
                  }, 1000)
                })
              } else {
                console.warn('报表模板缺少查询语句，创建新的空模板')
                // 不显示错误信息，创建一个新的空模板
                this.$store.dispatch('addTab', {
                  query: '',
                  name: '新报表',
                  viewType: 'table',
                  viewOptions: {},
                  rowLimit: '100',
                  dataSource: '1'
                }).then(tabId => {
                  console.log('创建空模板标签页成功:', tabId)
                  this.$store.commit('setCurrentTabId', tabId)
                })
              }
            } else {
              console.warn('报表模板数据不存在或格式错误，创建新的空模板')
              // 不显示错误信息，创建一个新的空模板
              this.$store.dispatch('addTab', {
                query: '',
                name: '新报表',
                viewType: 'table',
                viewOptions: {},
                rowLimit: '100',
                dataSource: '1'
              }).then(tabId => {
                console.log('创建空模板标签页成功:', tabId)
                this.$store.commit('setCurrentTabId', tabId)
              })
            }
          } else {
            console.warn('报表模板数据不存在或格式错误，创建新的空模板:', data)
            // 不显示错误信息，创建一个新的空模板
            this.$store.dispatch('addTab', {
              query: '',
              name: '新报表',
              viewType: 'table',
              viewOptions: {},
              rowLimit: '100',
              dataSource: '1'
            }).then(tabId => {
              console.log('创建空模板标签页成功:', tabId)
              this.$store.commit('setCurrentTabId', tabId)
            })
          }
        } else {
          console.warn('加载报表模板失败，创建新的空模板:', response.status)
          // 不显示错误信息，创建一个新的空模板
          this.$store.dispatch('addTab', {
            query: '',
            name: '新报表',
            viewType: 'table',
            viewOptions: {},
            rowLimit: '100',
            dataSource: '1'
          }).then(tabId => {
            console.log('创建空模板标签页成功:', tabId)
            this.$store.commit('setCurrentTabId', tabId)
          })
        }
      } catch (error) {
        console.warn('加载报表模板时发生错误，创建新的空模板:', error)
        // 不显示错误信息，创建一个新的空模板
        this.$store.dispatch('addTab', {
          query: '',
          name: '新报表',
          viewType: 'table',
          viewOptions: {},
          rowLimit: '100',
          dataSource: '1'
        }).then(tabId => {
          console.log('创建空模板标签页成功:', tabId)
          this.$store.commit('setCurrentTabId', tabId)
        })
      } finally {
        // 清理模板数据，避免内存泄漏
        templateData = null
        template = null
      }
    }
  }
}
</script>

<style>
#app,
.dialog,
input,
label,
button,
.plotly_editor * {
  font-family: Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
}
.CodeMirror-hints {
  z-index: 999 !important;
}
</style>
