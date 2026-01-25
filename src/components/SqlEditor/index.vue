<template>
  <div class="sql-editor-panel">
    <div class="codemirror-box original-style">
      <codemirror
        ref="cm"
        v-model:value="query"
        :options="cmOptions"
        :originalStyle="true"
        @change="onChange"
      />
    </div>
    <side-tool-bar panel="sqlEditor" @switch-to="$emit('switchTo', $event)">
      <icon-button
        ref="runBtn"
        :disabled="runDisabled"
        :loading="isGettingResults"
        tooltip="执行SQL查询"
        tooltipPosition="top-left"
        @click="$emit('run')"
      >
        <run-icon :disabled="runDisabled" />
      </icon-button>
      <icon-button
        ref="shareBtn"
        tooltip="分享此查询"
        tooltipPosition="top-left"
        @click="shareQuery"
      >
        <share-icon />
      </icon-button>
      <icon-button
        ref="exportBtn"
        tooltip="导出报表模板"
        tooltipPosition="top-left"
        @click="exportReportTemplate"
      >
        <export-icon />
      </icon-button>
    </side-tool-bar>
  </div>
</template>

<script>
import IconButton from '@/components/Common/IconButton'
import ExportIcon from '@/components/svg/export'
import RunIcon from '@/components/svg/run'
import ShareIcon from '@/components/svg/share'
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
  props: { modelValue: String, isGettingResults: Boolean },
  emits: ['update:modelValue', 'run', 'switchTo'],
  data() {
    return {
      query: this.modelValue,
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
      return !this.$store.state.db || !this.query || this.isGettingResults
    },
    currentInquiryTab() {
      return this.$store.state.currentTab
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
    }
  },
  methods: {
    onChange: time.debounce((value, editor) => showHint(editor), 400),
    focus() {
      this.$refs.cm.cminstance?.focus()
    },
    async shareQuery() {
      try {
        // Get current tab
        const currentTabId = this.$store.state.currentTabId
        const currentTab = this.$store.state.tabs.find(
          tab => tab.id === currentTabId
        )

        if (!currentTab) return

        // Generate shareable URL
        let shareId
        if (currentTab.isSaved && currentTab.inquiryId) {
          // For saved queries, use the inquiry ID as hash
          shareId = currentTab.inquiryId
        } else {
          // For unsaved queries, generate a random ID
          shareId = nanoid(10)
        }

        // Create the URL - using window.location.origin to get the base URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`

        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)

        // Show notification (using existing event system or alert for simplicity)
        alert(`分享链接已复制到剪贴板:\n${shareUrl}`)
      } catch (error) {
        console.error('Error sharing query:', error)
        alert('复制分享链接失败，请重试。')
      }
    },
    createNewInquiry() {
      this.$store.dispatch('addTab').then(id => {
        this.$store.commit('setCurrentTabId', id)
        if (this.$route.path !== '/workspace') {
          this.$router.push('/workspace')
        }
      })

      events.send('inquiry.create', null, { auto: false })
    },
    onSave(skipConcurrentEditingCheck = false) {
      if (!this.currentInquiryTab) return
      
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
          updatedAt: currentTab.updatedAt || new Date().toISOString()
        }

        // Export the inquiry as a report template
        storedInquiries.export([inquiry], `${inquiry.name}_报表模板.json`)
      } catch (error) {
        console.error('Error exporting report template:', error)
        alert('导出报表模板失败，请重试。')
      }
    }
  }
}
</script>

<style scoped>
.sql-editor-panel {
  display: flex;

  flex-grow: 1;
  height: 100%;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.codemirror-box {
  flex-grow: 1;
  overflow: auto;
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
</style>
