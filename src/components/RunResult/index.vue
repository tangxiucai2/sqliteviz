<template>
  <div ref="runResultPanel" class="run-result-panel">
    <component
      :is="viewValuePanelVisible ? 'splitpanes' : 'div'"
      :before="{ size: 50, max: 100 }"
      :after="{ size: 50, max: 100 }"
      :default="{ before: 50, after: 50 }"
      class="run-result-panel-content"
    >
      <template #left-pane>
        <div
          :id="'run-result-left-pane-' + tab.id"
          class="result-set-container"
        />
      </template>
      <div
        :id="'run-result-result-set-' + tab.id"
        class="result-set-container"
      />
      <template v-if="viewValuePanelVisible" #right-pane>
        <div class="value-viewer-container">
          <value-viewer
            v-show="selectedCell"
            :cellValue="
              selectedCell
                ? result.values[result.columns[selectedCell.dataset.col]][
                    selectedCell.dataset.row
                  ]
                : ''
            "
          />
          <div v-show="!selectedCell" class="table-preview">
            未选择要查看的单元格
          </div>
        </div>
      </template>
    </component>

    <side-tool-bar :showToggleButtons="showToggleButtons" panel="table" @switch-to="$emit('switchTo', $event)">
      <icon-button
        :disabled="!result"
        tooltip="将结果集导出为CSV文件"
        tooltipPosition="top-left"
        @click="exportToCsv"
      >
        <export-to-csv-icon />
      </icon-button>

      <icon-button
        ref="copyToClipboardBtn"
        :disabled="!result"
        tooltip="复制结果集到剪贴板"
        tooltipPosition="top-left"
        @click="prepareCopy"
      >
        <clipboard-icon />
      </icon-button>

      <icon-button
        ref="rowBtn"
        :disabled="!result"
        tooltip="查看记录"
        tooltipPosition="top-left"
        :active="viewRecord"
        @click="toggleViewRecord"
      >
        <row-icon />
      </icon-button>

      <icon-button
        ref="viewCellValueBtn"
        :disabled="!result"
        tooltip="查看值"
        tooltipPosition="top-left"
        :active="viewValuePanelVisible"
        @click="toggleViewValuePanel"
      >
        <view-cell-value-icon />
      </icon-button>


    </side-tool-bar>

    <loading-dialog
      v-model="showLoadingDialog"
      loadingMsg="生成CSV中..."
      successMsg="CSV已准备就绪"
      actionBtnName="复制"
      title="复制到剪贴板"
      :loading="preparingCopy"
      @action="copyToClipboard"
      @cancel="cancelCopy"
    />

    <teleport defer :to="resultSetTeleportTarget" :disabled="!enableTeleport">
      <div>
        <div
          v-show="result === null && !isGettingResults && !error"
          class="table-preview result-before"
        >
          运行您的查询以获取结果
        </div>
        <div v-if="isGettingResults" class="table-preview result-in-progress">
          <loading-indicator :size="30" />
          获取结果中...
        </div>
        <div
          v-show="result === undefined && !isGettingResults && !error"
          class="table-preview result-empty"
        >
          根据您的查询未检索到任何行
        </div>
        <logs v-if="error" :messages="[error]" />
        <sql-table
          v-if="result && !viewRecord"
          :data-set="result"
          :time="time"
          :pageSize="pageSize"
          :page="defaultPage"
          :selectedCellCoordinates="defaultSelectedCell"
          class="straight"
          @update-selected-cell="onUpdateSelectedCell"
        />

        <record
          v-if="result && viewRecord"
          ref="recordView"
          :data-set="result"
          :time="time"
          :selectedColumnIndex="selectedCell ? +selectedCell.dataset.col : 0"
          :rowIndex="selectedCell ? +selectedCell.dataset.row : 0"
          @update-selected-cell="onUpdateSelectedCell"
        />
      </div>
    </teleport>
  </div>
</template>

<script>
import IconButton from '@/components/Common/IconButton'
import loadingDialog from '@/components/Common/LoadingDialog'
import LoadingIndicator from '@/components/Common/LoadingIndicator'
import Logs from '@/components/Common/Logs'
import Splitpanes from '@/components/Common/Splitpanes'
import SideToolBar from '@/components/SideToolBar'
import SqlTable from '@/components/SqlTable'
import ClipboardIcon from '@/components/svg/clipboard'
import ExportToCsvIcon from '@/components/svg/exportToCsv'
import RowIcon from '@/components/svg/row'
import ShareIcon from '@/components/svg/share'
import ViewCellValueIcon from '@/components/svg/viewCellValue'
import csv from '@/lib/csv'
import cIo from '@/lib/utils/clipboardIo'
import events from '@/lib/utils/events'
import fIo from '@/lib/utils/fileIo'
import time from '@/lib/utils/time'
import Record from './Record/index.vue'
import ValueViewer from './ValueViewer'

export default {
  name: 'RunResult',
  components: {
    SqlTable,
    LoadingIndicator,
    Logs,
    SideToolBar,
    ExportToCsvIcon,
    IconButton,
    ClipboardIcon,
    ViewCellValueIcon,
    RowIcon,
    ShareIcon,
    loadingDialog,
    ValueViewer,
    Record,
    Splitpanes
  },
  props: {
    tab: Object,
    result: Object,
    isGettingResults: Boolean,
    error: Object,
    time: [String, Number],
    showToggleButtons: {
      type: Boolean,
      default: true
    }
  },
  emits: ['switchTo'],
  data() {
    return {
      resizeObserver: null,
      pageSize: 20,
      preparingCopy: false,
      dataToCopy: null,
      viewValuePanelVisible: false,
      selectedCell: null,
      viewRecord: false,
      defaultPage: 1,
      defaultSelectedCell: null,
      enableTeleport: this.$store.state.isWorkspaceVisible,
      showLoadingDialog: false
    }
  },
  computed: {
    resultSetTeleportTarget() {
      if (!this.enableTeleport) {
        return undefined
      }
      const base = `#${
        this.viewValuePanelVisible
          ? 'run-result-left-pane'
          : 'run-result-result-set'
      }`
      const tabIdPostfix = `-${this.tab.id}`
      return base + tabIdPostfix
    }
  },
  watch: {
    result() {
      this.defaultSelectedCell = null
      this.selectedCell = null
    }
  },
  activated() {
    this.enableTeleport = true
  },
  deactivated() {
    this.enableTeleport = false
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.$refs.runResultPanel)
    this.calculatePageSize()
  },
  beforeUnmount() {
    this.resizeObserver.unobserve(this.$refs.runResultPanel)
  },
  methods: {
    handleResize() {
      this.calculatePageSize()
    },

    calculatePageSize() {
      const runResultPanel = this.$refs.runResultPanel
      // 27 - table footer hight
      // 5 - padding-bottom of rounded table container
      // 35 - height of table header
      const freeSpace = runResultPanel.offsetHeight - 27 - 5 - 35
      this.pageSize = Math.max(Math.floor(freeSpace / 35), 20)
    },

    exportToCsv() {
      if (this.result && this.result.values) {
        events.send(
          'resultset.export',
          this.result.values[this.result.columns[0]].length,
          { to: 'csv' }
        )
      }

      fIo.exportToFile(csv.serialize(this.result), 'result_set.csv', 'text/csv')
    },

    async prepareCopy() {
      if (this.result && this.result.values) {
        events.send(
          'resultset.export',
          this.result.values[this.result.columns[0]].length,
          { to: 'clipboard' }
        )
      }

      if ('ClipboardItem' in window) {
        this.preparingCopy = true
        this.showLoadingDialog = true
        const t0 = performance.now()

        await time.sleep(0)
        this.dataToCopy = csv.serialize(this.result)
        const t1 = performance.now()
        if (t1 - t0 < 950) {
          this.copyToClipboard()
        } else {
          this.preparingCopy = false
        }
      } else {
        alert(
          "Your browser doesn't support copying into the clipboard. " +
            'If you use Firefox you can enable it ' +
            'by setting dom.events.asyncClipboard.clipboardItem to true.'
        )
      }
    },

    copyToClipboard() {
      cIo.copyText(this.dataToCopy, 'CSV copied to clipboard successfully')
      this.showLoadingDialog = false
    },

    cancelCopy() {
      this.dataToCopy = null
    },

    toggleViewValuePanel() {
      this.viewValuePanelVisible = !this.viewValuePanelVisible
    },

    toggleViewRecord() {
      if (this.viewRecord) {
        this.defaultSelectedCell = {
          row: this.$refs.recordView.currentRowIndex,
          col: this.selectedCell ? +this.selectedCell.dataset.col : 0
        }
        this.defaultPage = Math.ceil(
          (this.$refs.recordView.currentRowIndex + 1) / this.pageSize
        )
      }

      this.viewRecord = !this.viewRecord
    },

    onUpdateSelectedCell(e) {
      this.selectedCell = e
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
          shareId = crypto.randomUUID
            ? crypto.randomUUID().slice(0, 10)
            : Math.random().toString(36).substring(2, 12)
        }

        // Create the URL - using window.location.origin to get the base URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`

        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl)

        // Show notification
        alert(`分享链接已复制到剪贴板:\n${shareUrl}`)
      } catch (error) {
        console.error('Error sharing query:', error)
        alert('复制分享链接失败，请重试。')
      }
    }
  }
}
</script>

<style scoped>
.run-result-panel {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.run-result-panel-content {
  flex-grow: 1;
  height: 100%;
  width: 0;
}

.result-set-container,
.result-set-container > div {
  position: relative;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
.value-viewer-container {
  height: 100%;
  width: 100%;
  background-color: var(--color-white);
  position: relative;
}

.table-preview {
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--color-text-base);
  font-size: 13px;
  text-align: center;
}

.result-in-progress {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  will-change: opacity;
  /*
    We need to show loader in 1 sec after starting query execution. We can't do that with
    setTimeout because the main thread can be busy by getting a result set from the web worker.
    But we can use CSS animation for opacity. Opacity triggers changes only in the Composite Layer
    stage in rendering waterfall. Hence it can be processed only with Compositor Thread while
    the Main Thread processes a result set.
    https://www.viget.com/articles/animation-performance-101-browser-under-the-hood/
  */
  animation: show-loader 1s linear 0s 1;
}

@keyframes show-loader {
  0% {
    opacity: 0;
  }
  99% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
