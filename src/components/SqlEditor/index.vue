<template>
  <div class="sql-editor-panel">
    <!-- 操作栏 -->
    <div class="sql-editor-toolbar">
      <div class="toolbar-left">
        <button 
          class="toolbar-btn primary-btn" 
          :disabled="runDisabled"
          :class="{ 'loading': isGettingResults }"
          @click="executeQuery"
        >
          执行
        </button>
        <button 
          class="toolbar-btn secondary-btn"
          @click="onSave(false)"
        >
          保存
        </button>
        <button 
          class="toolbar-btn secondary-btn"
          @click="exportReportTemplate"
        >
          导出模板配置
        </button>
        <button 
          class="toolbar-btn secondary-btn"
          @click="importTemplate"
        >
          导入模板配置
        </button>
        <input 
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileImport"
        >
      </div>
      <div class="toolbar-right">
        <div class="row-limit-selector">
          <label class="selector-label">查询行数：</label>
          <select v-model="rowLimit" class="selector">
            <option value="unlimited">不限</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="custom">自定义</option>
          </select>
          <input 
            v-if="rowLimit === 'custom'" 
            v-model="customRowLimit" 
            type="number" 
            min="1" 
            class="custom-limit-input"
            placeholder="请输入行数"
          />
        </div>
        <div class="data-source-selector">
          <label class="selector-label">数据源：</label>
          <select v-model="localDataSource" class="selector">
            <option value="1">业务库</option>
            <option value="2">事件库</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 提示信息 -->
    <div class="sql-editor-hint">
      提示：请输入SQL查询语句（只允许以SELECT开头的查询语句，不能包含注释），然后点击执行按钮
    </div>
    
    <div class="codemirror-box original-style">
      <codemirror
        ref="cm"
        v-model:value="query"
        :options="cmOptions"
        :originalStyle="true"
        @change="onChange"
      />
    </div>
  </div>
</template>

<script>
import IconButton from '@/components/Common/IconButton'
import ExportIcon from '@/components/svg/export'
import RunIcon from '@/components/svg/run'
import ShareIcon from '@/components/svg/share'
import config from '@/config'
import eventBus from '@/lib/eventBus'
import storedInquiries from '@/lib/storedInquiries'
import events from '@/lib/utils/events'
import time from '@/lib/utils/time'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/addon/display/autorefresh.js'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/sql/sql.js'
import 'codemirror/theme/neo.css'
import { nanoid } from 'nanoid'
import SideToolBar from '../SideToolBar'
import showHint, { showHintOnDemand } from './hint'

export default {
  name: 'SqlEditor',
  components: {
    Codemirror,
    SideToolBar,
    IconButton,
    RunIcon,
    ShareIcon,
    ExportIcon
  },
  props: { 
    modelValue: String, 
    isGettingResults: Boolean,
    dataSource: {
      type: String,
      default: '1'
    }
  },
  emits: ['update:modelValue', 'run', 'switchTo'],
  data() {
    return {
      query: this.modelValue,
      localDataSource: this.dataSource, // 使用props中的dataSource作为默认值
      rowLimit: '100', // 默认限制100行
      customRowLimit: '', // 自定义行数
      selectedDatabase: '业务库',
      name: '',
      errorMsg: null,
      cmOptions: {
        tabSize: 4,
        mode: 'text/x-mysql',
        theme: 'neo',
        lineNumbers: true,
        line: true,
        autoRefresh: true,
        styleActiveLine: false,
        extraKeys: { 'Ctrl-Space': showHintOnDemand }
      }
    }
  },
  computed: {
    runDisabled() {
      if (!this.query || this.isGettingResults) {
        return true
      }
      
      // 验证SQL语句
      const trimmedQuery = this.query.trim()
      
      // 检查是否为空
      if (!trimmedQuery) {
        return true
      }
      
      // 检查是否以SELECT开头（不区分大小写）
      if (!trimmedQuery.toLowerCase().startsWith('select')) {
        return true
      }
      
      // 检查是否包含注释
      if (trimmedQuery.includes('--') || trimmedQuery.includes('/*')) {
        return true
      }
      
      return false
    },
    currentInquiryTab() {
      // 首先尝试从store中获取currentTab
      if (this.$store.state.currentTab) {
        return this.$store.state.currentTab
      }
      // 如果没有currentTab，根据currentTabId从tabs数组中查找
      if (this.$store.state.currentTabId && this.$store.state.tabs) {
        return this.$store.state.tabs.find(
          tab => tab.id === this.$store.state.currentTabId
        )
      }
      return null
    },
    isSaved() {
      return this.currentInquiryTab && this.currentInquiryTab.isSaved
    },
    inquiries() {
      return this.$store.state.inquiries
    }
  },
  watch: {
    query() {
      this.$emit('update:modelValue', this.query)
    },
    // 监听dataSource属性的变化，更新内部的localDataSource变量
    dataSource: {
      handler(newValue) {
        if (newValue) {
          this.localDataSource = newValue
        }
      },
      immediate: true
    }
  },
  created() {
    console.log('SqlEditor组件创建，接收到的dataSource:', this.dataSource)
    console.log('SqlEditor组件创建，localDataSource初始值:', this.localDataSource)
    // 手动设置localDataSource的值，确保它使用的是已经初始化好的props值
    this.localDataSource = this.dataSource
    console.log('SqlEditor组件创建，localDataSource更新后的值:', this.localDataSource)
  },
  methods: {
    onChange: time.debounce((value, editor) => showHint(editor), 400),
    focus() {
      this.$refs.cm.cminstance?.focus()
    },
    onSave(skipConcurrentEditingCheck = false) {
      if (!this.currentInquiryTab) return
      
      // 检查是否为嵌入模式，并且有报表ID参数
      const urlParams = new URLSearchParams(window.location.search)
      const reportId = urlParams.get('id')
      const isEmbeddedMode = urlParams.get('embedded') === '1'
      
      // 在嵌入模式下，跳过名称检查，直接保存
      if (isEmbeddedMode && reportId) {
        console.log('嵌入模式保存，跳过名称检查')
        this.saveInquiry()
        return
      }
      
      // 非嵌入模式，使用原有逻辑
      if (storedInquiries.isTabNeedName(this.currentInquiryTab)) {
        this.openSaveModal()
        return
      }

      if (!skipConcurrentEditingCheck) {
        const inquiryInStore = this.inquiries.find(
          inquiry => inquiry.id === this.currentInquiryTab.id
        )

        if (
          inquiryInStore &&
          inquiryInStore.updatedAt !== this.currentInquiryTab.updatedAt
        ) {
          this.$modal.show('inquiry-conflict')
          return
        }
      }
      this.saveInquiry()
    },
    onSaveAs() {
      this.openSaveModal()
    },
    openSaveModal() {
      this.$modal.hide('inquiry-conflict')
      this.errorMsg = null
      this.name = ''
      this.$modal.show('save')
    },
    validateSaveFormAndSaveInquiry() {
      if (!this.name) {
        this.errorMsg = "查询名称不能为空"
        return
      }
      this.saveInquiry()
    },
    async saveInquiry() {
      if (!this.currentInquiryTab) return
      
      const eventName = 
        this.currentInquiryTab.name && this.name
          ? 'inquiry.saveAs'
          : 'inquiry.save'

      // 检查是否为嵌入模式，并且有报表ID参数
      const urlParams = new URLSearchParams(window.location.search)
      const reportId = urlParams.get('id')
      const isEmbeddedMode = urlParams.get('embedded') === '1'
      
      if (isEmbeddedMode && reportId) {
        console.log('嵌入模式保存报表，调用后端接口:', reportId)
        
        // 构建模板对象
        const templateObj = {
          version: 2,
          inquiries: [
            {
              id: this.currentInquiryTab.id || reportId,
              name: this.name || this.currentInquiryTab.name || '未命名查询',
              query: this.currentInquiryTab.query,
              viewType: this.currentInquiryTab.viewType || 'chart',
              viewOptions: this.currentInquiryTab.viewOptions || {
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
              updatedAt: new Date().toISOString(),
              rowLimit: this.rowLimit,
              customRowLimit: this.customRowLimit,
              dataSource: this.localDataSource
            }
          ]
        }
        
        // 构建要保存的模板数据，将template转换为字符串
        const templateData = {
          id: parseInt(reportId),
          template: JSON.stringify(templateObj)
        }
        
        try {
          // 调用后端接口更新报表模板
          const { baseUrl, apiPrefix } = config.backend
          const apiUrl = `${baseUrl}${apiPrefix}/infra/report`
          console.log('API地址:', apiUrl)
          const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData)
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('保存报表模板成功:', data)
            
            if (data.code === 200) {
              // 更新标签页状态
              this.$store.commit('updateTab', {
                tab: this.currentInquiryTab,
                newValues: {
                  name: templateData.name,
                  isSaved: true,
                  updatedAt: new Date().toISOString()
                }
              })
              
              // Hide dialogs
              this.$modal.hide('save')
              this.$modal.hide('inquiry-conflict')
              this.errorMsg = null
              this.name = ''
              
              // Signal about saving
              eventBus.$emit('inquirySaved')
              events.send(eventName)
              
              alert('报表保存成功')
            } else {
              console.error('保存报表模板失败:', data.msg)
              alert(`保存报表失败: ${data.msg}`)
            }
          } else {
            console.error('保存报表模板失败:', response.status)
            alert('保存报表失败，请检查网络连接')
          }
        } catch (error) {
          console.error('保存报表模板时发生错误:', error)
          alert('保存报表时发生错误，请重试')
        }
      } else {
        // 非嵌入模式，使用原有逻辑
        console.log('非嵌入模式保存报表，使用原有逻辑')
        
        // Save inquiry
        const value = await this.$store.dispatch('saveInquiry', {
          inquiryTab: this.currentInquiryTab,
          newName: this.name
        })

        // Update tab in store
        this.$store.commit('updateTab', {
          tab: this.currentInquiryTab,
          newValues: {
            name: value.name,
            id: value.id,
            query: value.query,
            viewType: value.viewType,
            viewOptions: value.viewOptions,
            isSaved: true,
            updatedAt: value.updatedAt
          }
        })

        // Hide dialogs
        this.$modal.hide('save')
        this.$modal.hide('inquiry-conflict')
        this.errorMsg = null
        this.name = ''

        // Signal about saving
        eventBus.$emit('inquirySaved')
        events.send(eventName)
      }
    },
    cancelSave() {
      this.errorMsg = null
      this.name = ''
      this.$modal.hide('save')
      this.$modal.hide('inquiry-conflict')
      eventBus.$off('inquirySaved')
    },
    exportReportTemplate() {
      try {
        // Get current tab
        const currentTabId = this.$store.state.currentTabId
        const currentTab = this.$store.state.tabs.find(
          tab => tab.id === currentTabId
        )

        if (!currentTab) return

        // Create an inquiry object from the current tab
        const inquiry = {
          id: currentTab.id || nanoid(10),
          name: currentTab.name || '未命名查询',
          query: currentTab.query,
          viewType: currentTab.viewType || 'table',
          viewOptions: currentTab.viewOptions || {},
          updatedAt: currentTab.updatedAt || new Date().toISOString(),
          rowLimit: this.rowLimit,
          customRowLimit: this.customRowLimit,
          dataSource: this.localDataSource
        }

        // Export the inquiry as a report template
        storedInquiries.export([inquiry], `${inquiry.name}_报表模板.json`)
      } catch (error) {
        console.error('Error exporting report template:', error)
        alert('导出报表模板失败，请重试。')
      }
    },
    executeQuery() {
      console.log('执行按钮被点击')
      // 处理SQL查询语句，添加LIMIT子句
      let processedQuery = this.query.trim()
      
      // 根据行数限制处理SQL
      if (this.rowLimit !== 'unlimited') {
        let limitValue
        
        if (this.rowLimit === 'custom') {
          // 检查自定义行数是否有效
          const customLimit = parseInt(this.customRowLimit)
          if (isNaN(customLimit) || customLimit < 1) {
            alert('请输入有效的行数')
            return
          }
          limitValue = customLimit
        } else {
          limitValue = parseInt(this.rowLimit)
        }
        
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
      
      console.log('执行参数:', this.localDataSource, processedQuery)
      // 执行查询
      this.$emit('run', { dataSource: this.localDataSource, query: processedQuery })
    },
    importTemplate() {
      // 触发文件选择对话框
      this.$refs.fileInput.click()
    },
    handleFileImport(event) {
      const file = event.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          let template
          // 检查导入的数据格式
          if (Array.isArray(importedData) && importedData.length > 0) {
            // 支持数组格式（多个模板）
            template = importedData[0]
          } else if (typeof importedData === 'object' && importedData !== null) {
            // 支持包含inquiries数组的格式
            if (importedData.inquiries && Array.isArray(importedData.inquiries) && importedData.inquiries.length > 0) {
              template = importedData.inquiries[0]
            } else {
              // 支持单个对象格式
              template = importedData
            }
          } else {
            alert('导入的模板格式不正确，请确保是有效的报表模板文件')
            return
          }
          
          // 确保模板包含必要的字段
          if (!template.query) {
            alert('导入的模板缺少查询语句，请确保是有效的报表模板文件')
            return
          }
          
          // 更新当前查询
          console.log('导入的模板查询:', template.query)
          if (template.query) {
            this.query = template.query
            this.$emit('update:modelValue', this.query)
            console.log('更新后的查询:', this.query)
          }
          
          // 设置查询行数和数据源选项
          if (template.rowLimit !== undefined) {
            this.rowLimit = template.rowLimit
            console.log('导入的行数限制:', template.rowLimit)
          }
          if (template.customRowLimit !== undefined) {
            this.customRowLimit = template.customRowLimit
            console.log('导入的自定义行数:', template.customRowLimit)
          }
          if (template.dataSource !== undefined) {
            this.localDataSource = template.dataSource
            console.log('导入的数据源:', template.dataSource)
          }
          
          // 处理SQL查询语句，添加LIMIT子句
          let processedQuery = template.query.trim()
          
          // 根据行数限制处理SQL
          if (template.rowLimit !== 'unlimited') {
            let limitValue
            
            if (template.rowLimit === 'custom') {
              // 检查自定义行数是否有效
              const customLimit = parseInt(template.customRowLimit)
              if (isNaN(customLimit) || customLimit < 1) {
                alert('请输入有效的行数')
                return
              }
              limitValue = customLimit
            } else {
              limitValue = parseInt(template.rowLimit)
            }
            
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
          
          console.log('处理后的查询:', processedQuery)
          console.log('数据源:', template.dataSource)
          
          // 根据viewType设置布局
          let layout;
          if (template.viewType === 'table') {
            // 表格视图，显示表格
            layout = {
              sqlEditor: 'above',
              table: 'bottom',
              dataView: 'hidden'
            };
          } else {
            // 图表视图，显示数据视图
            layout = {
              sqlEditor: 'above',
              table: 'hidden',
              dataView: 'bottom'
            };
          }
          
          // 直接创建新标签页，使用模板中的配置
          this.$store.dispatch('addTab', {
            query: template.query,
            name: template.name || '导入的模板',
            viewType: template.viewType,
            viewOptions: template.viewOptions || {},
            rowLimit: template.rowLimit,
            customRowLimit: template.customRowLimit,
            dataSource: template.dataSource,
            layout: layout
          }).then(newTabId => {
            console.log('创建新标签页成功:', newTabId)
            
            // 等待新标签页创建完成
            setTimeout(() => {
              // 获取新标签页
              const newTab = this.$store.state.tabs.find(
                tab => tab.id === newTabId
              )
              
              if (newTab) {
                // 只在新标签页中执行一次查询
                newTab.execute(template.dataSource, processedQuery).then(() => {
                  // 保存模板信息用于日志
                  const templateViewType = template.viewType
                  const templateViewOptions = template.viewOptions
                  
                  // 等待查询结果处理完成
                  setTimeout(() => {
                    // 检查新标签页的查询结果
                    if (newTab.result && newTab.result.values) {
                      console.log('新标签页查询结果:', newTab.result)
                      console.log('结果集列数:', newTab.result.columns.length)
                      console.log('结果集行数:', newTab.result.values[newTab.result.columns[0]].length)
                      console.log('图表类型:', templateViewType)
                      console.log('图表选项:', templateViewOptions)
                    } else {
                      console.error('新标签页查询结果为空或格式不正确')
                      alert('查询结果为空，请检查SQL语句')
                    }
                  }, 1000)
                }).catch(error => {
                  console.error('新标签页查询执行失败:', error)
                  alert('查询执行失败，请检查SQL语句')
                })
                
                // 切换到新标签页
                this.$store.commit('setCurrentTabId', newTabId)
                
                // 显示成功提示
                alert('模板配置导入成功，已创建新标签页显示图表')
              }
            }, 1000)
          }).catch(error => {
            console.error('创建新标签页失败:', error)
            alert('模板配置导入失败，请重试')
          })
        } catch (error) {
          console.error('Error importing template:', error)
          alert('导入模板失败，请检查文件格式是否正确')
        } finally {
          // 重置文件输入，以便可以再次选择同一个文件
          event.target.value = ''
        }
      }
      reader.onerror = () => {
        alert('读取文件失败，请重试')
        event.target.value = ''
      }
      reader.readAsText(file)
    }
  }
}
</script>

<style scoped>
.sql-editor-panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 操作栏样式 */
.sql-editor-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border-light);
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 15px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* 数据源选择器样式 */
.data-source-selector,
.row-limit-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 15px;
}

.selector-label {
  font-size: 14px;
  color: var(--color-text-base);
  white-space: nowrap;
}

.selector {
  padding: 6px 8px;
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  font-size: 14px;
  color: var(--color-text-base);
  background-color: white;
  cursor: pointer;
}

.selector:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

/* 自定义行数输入框样式 */
.custom-limit-input {
  padding: 6px 8px;
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  font-size: 14px;
  color: var(--color-text-base);
  width: 80px;
}

.custom-limit-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

/* 提示信息样式 */
.sql-editor-hint {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 13px;
  color: #646c77;
  line-height: 1.4;
}

.toolbar-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.primary-btn {
  background-color: #165dff;
  color: white;
}

.primary-btn:hover:not(:disabled) {
  background-color: #4080ff;
  color: white;
}

.primary-btn:disabled {
  background-color: #c9cdd4;
  color: white;
  cursor: not-allowed;
}

.primary-btn.loading {
  background-color: #165dff;
  opacity: 0.8;
  position: relative;
  color: white;
}

.primary-btn.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 10px;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.secondary-btn {
  background-color: white;
  color: var(--color-text-base);
  border: 1px solid var(--color-border-light);
}

.secondary-btn:hover {
  background-color: var(--color-bg-light);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.codemirror-box {
  flex-grow: 1;
  overflow: auto;
  position: relative;
}

:deep(.codemirror-container) {
  display: block;
  height: 100%;
  max-height: 100%;
}
:deep(.CodeMirror) {
  height: 100%;
  max-height: 100%;
}
:deep(.CodeMirror-cursor) {
  width: 1px;
  background: var(--color-text-base);
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}
</style>
