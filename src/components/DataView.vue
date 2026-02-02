<template>
  <div class="data-view-panel">
    <div class="data-view-panel-content">
      <component
        :is="mode"
        ref="viewComponent"
        v-model:exportToPngEnabled="exportToPngEnabled"
        v-model:exportToSvgEnabled="exportToSvgEnabled"
        v-model:exportToHtmlEnabled="exportToHtmlEnabled"
        v-model:exportToClipboardEnabled="exportToClipboardEnabled"
        :initOptions="initOptionsByMode[mode]"
        :data-sources="dataSource"
        :showViewSettings="showViewSettings"
        @loading-image-completed="loadingImage = false"
        @update="$emit('update')"
      />
    </div>
    <!-- 非报表模式下显示侧边栏 -->
    <side-tool-bar v-if="internalShowViewSettings" panel="dataView" @switch-to="$emit('switchTo', $event)">
      <icon-button
        ref="chartBtn"
        :active="mode === 'chart'"
        tooltip="切换到图表"
        tooltipPosition="top-left"
        @click="mode = 'chart'"
      >
        <chart-icon />
      </icon-button>
      <icon-button
        ref="pivotBtn"
        :active="mode === 'pivot'"
        tooltip="切换到透视表"
        tooltipPosition="top-left"
        @click="mode = 'pivot'"
      >
        <pivot-icon />
      </icon-button>
      <icon-button
        v-show="false"
        ref="graphBtn"
        :active="mode === 'graph'"
        tooltip="切换到图形"
        tooltipPosition="top-left"
        @click="mode = 'graph'"
      >
        <graph-icon />
      </icon-button>

      <div class="side-tool-bar-divider" />

      <icon-button
        ref="settingsBtn"
        :active="internalShowViewSettings"
        tooltip="图表设置"
        tooltipPosition="top-left"
        @click="internalShowViewSettings = !internalShowViewSettings"
      >
        <settings-icon />
      </icon-button>

      <div class="side-tool-bar-divider" />

      <icon-button
        ref="pngExportBtn"
        :disabled="!exportToPngEnabled || loadingImage"
        :loading="loadingImage"
        tooltip="保存为PNG图片"
        tooltipPosition="top-left"
        @click="saveAsPng"
      >
        <png-icon />
      </icon-button>
      <icon-button
        ref="svgExportBtn"
        :disabled="!exportToSvgEnabled"
        tooltip="保存为SVG"
        tooltipPosition="top-left"
        @click="saveAsSvg"
      >
        <export-to-svg-icon />
      </icon-button>

      <icon-button
        ref="htmlExportBtn"
        :disabled="!exportToHtmlEnabled"
        tooltip="保存为HTML"
        tooltipPosition="top-left"
        @click="saveAsHtml"
      >
        <HtmlIcon />
      </icon-button>
      <icon-button
        ref="copyToClipboardBtn"
        :disabled="!exportToClipboardEnabled"
        :loading="copyingImage"
        tooltip="复制可视化到剪贴板"
        tooltipPosition="top-left"
        @click="prepareCopy"
      >
        <clipboard-icon />
      </icon-button>
      
    </side-tool-bar>

    <!-- 非报表模式下显示加载对话框 -->
    <loading-dialog
      v-if="internalShowViewSettings"
      v-model="showLoadingDialog"
      loadingMsg="正在渲染可视化..."
      successMsg="图片已准备就绪"
      actionBtnName="复制"
      title="复制到剪贴板"
      :loading="preparingCopy"
      @action="copyToClipboard"
      @cancel="cancelCopy"
    />
  </div>
</template>

<script>
import Chart from '@/components/Chart.vue'
import IconButton from '@/components/Common/IconButton'
import loadingDialog from '@/components/Common/LoadingDialog.vue'
import Graph from '@/components/Graph/index.vue'
import Pivot from '@/components/Pivot'
import SideToolBar from '@/components/SideToolBar'
import ChartIcon from '@/components/svg/chart'
import ClipboardIcon from '@/components/svg/clipboard'
import ExportToSvgIcon from '@/components/svg/exportToSvg'
import GraphIcon from '@/components/svg/graph.vue'
import HtmlIcon from '@/components/svg/html'
import PivotIcon from '@/components/svg/pivot'
import PngIcon from '@/components/svg/png'
import SettingsIcon from '@/components/svg/settings.vue'
import ShareIcon from '@/components/svg/share'
import cIo from '@/lib/utils/clipboardIo'
import events from '@/lib/utils/events'
import time from '@/lib/utils/time'

export default {
  name: 'DataView',
  components: {
    Chart,
    Pivot,
    Graph,
    SideToolBar,
    IconButton,
    ChartIcon,
    PivotIcon,
    GraphIcon,
    SettingsIcon,
    ExportToSvgIcon,
    PngIcon,
    HtmlIcon,
    ClipboardIcon,
    ShareIcon,
    loadingDialog
  },
  props: {
    dataSource: Object,
    initOptions: Object,
    initMode: String,
    showViewSettings: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update', 'switchTo'],
  data() {
    return {
      mode: this.initMode || 'chart',
      exportToPngEnabled: true,
      exportToSvgEnabled: true,
      exportToHtmlEnabled: true,
      exportToClipboardEnabled: true,
      loadingImage: false,
      copyingImage: false,
      preparingCopy: false,
      dataToCopy: null,
      initOptionsByMode: {
        chart: this.initMode === 'chart' ? this.initOptions : null,
        pivot: this.initMode === 'pivot' ? this.initOptions : null,
        graph: this.initMode === 'graph' ? this.initOptions : null
      },
      showLoadingDialog: false,
      internalShowViewSettings: this.showViewSettings
    }
  },
  computed: {
    plotlyInPivot() {
      return this.mode === 'pivot' && this.$refs.viewComponent.viewCustomChart
    }
  },
  watch: {
    mode(newMode, oldMode) {
      this.$emit('update')
      this.exportToPngEnabled = true
      this.exportToClipboardEnabled = true
      this.initOptionsByMode[oldMode] = this.getOptionsForSave()
    }
  },
  methods: {
    async saveAsPng() {
      this.loadingImage = true
      /*
      setTimeout does its thing by putting its callback on the callback queue.
      The callback queue is only called by the browser after both the call stack
      and the render queue are done. So our animation (which is on the call stack) gets done,
      the render queue renders it, and then the browser is ready for the callback queue
      and calls the long-calculation.

      nextTick allows you to do something after you have changed the data
      and VueJS has updated the DOM based on your data change,
      but before the browser has rendered those changed on the page.

      http://www.hesselinkwebdesign.nl/2019/nexttick-vs-settimeout-in-vue/

      */
      await time.sleep(0)
      this.$refs.viewComponent.saveAsPng()
      this.exportSignal('png')
    },
    getOptionsForSave() {
      if (!this.$refs.viewComponent) {
        return null
      }
      // 检查viewComponent是否有getOptionsForSave方法
      if (typeof this.$refs.viewComponent.getOptionsForSave === 'function') {
        return this.$refs.viewComponent.getOptionsForSave()
      }
      // 如果没有这个方法，返回null
      return null
    },
    async prepareCopy() {
      if ('ClipboardItem' in window) {
        this.preparingCopy = true
        this.showLoadingDialog = true
        const t0 = performance.now()

        await time.sleep(0)
        this.dataToCopy = await this.$refs.viewComponent.prepareCopy()
        const t1 = performance.now()
        if (t1 - t0 < 950) {
          this.copyToClipboard()
        } else {
          this.preparingCopy = false
        }
      } else {
        alert(
          "您的浏览器不支持将图片复制到剪贴板。" +
            '如果您使用Firefox，您可以通过将dom.events.asyncClipboard.clipboardItem设置为true来启用此功能。'
        )
      }
    },
    copyToClipboard() {
      cIo.copyImage(this.dataToCopy)
      this.showLoadingDialog = false
      this.exportSignal('clipboard')
    },
    cancelCopy() {
      this.dataToCopy = null
    },

    saveAsSvg() {
      this.$refs.viewComponent.saveAsSvg()
      this.exportSignal('svg')
    },
    saveAsHtml() {
      this.$refs.viewComponent.saveAsHtml()
      this.exportSignal('html')
    },
    exportSignal(to) {
      const eventLabels = { type: to }

      if (this.mode === 'chart' || this.plotlyInPivot) {
        eventLabels.pivot = this.plotlyInPivot
      }

      events.send(
        this.mode === 'chart' || this.plotlyInPivot
          ? 'viz_plotly.export'
          : this.mode === 'graph'
            ? 'viz_graph.export'
            : 'viz_pivot.export',
        null,
        eventLabels
      )
    },

    async shareQuery() {
      try {
        // Get current tab
        const currentTabId = this.$store.state.currentTabId
        const currentTab = this.$store.state.tabs.find(tab => tab.id === currentTabId)
        
        if (!currentTab) return
        
        // Generate shareable URL
        let shareId
        if (currentTab.isSaved && currentTab.inquiryId) {
          // For saved queries, use the inquiry ID as hash
          shareId = currentTab.inquiryId
        } else {
          // For unsaved queries, generate a random ID
          shareId = crypto.randomUUID ? crypto.randomUUID().slice(0, 10) : Math.random().toString(36).substring(2, 12)
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
.data-view-panel {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.data-view-panel-content {
  position: relative;
  flex-grow: 1;
  width: calc(100% - 39px);
  height: 100%;
  overflow: auto;
}
</style>
