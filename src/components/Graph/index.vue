<template>
  <div ref="graphContainer" class="graph-container">
    <div v-show="!dataSources" class="warning data-view-warning no-data">
      没有数据可以构建图形。请运行您的SQL查询并确保结果不为空。
    </div>
    <div
      v-show="!dataSourceIsValid"
      class="warning data-view-warning invalid-data"
    >
      结果集对图形可视化无效。
      <!-- 在
      <a href="#" target="_blank">
        文档</a
      >中了解更多信息。 -->
    </div>
    <div
      class="graph"
      :style="{
        height:
          !dataSources || !dataSourceIsValid ? 'calc(100% - 40px)' : '100%'
      }"
    >
      <GraphEditor
        ref="graphEditor"
        :dataSources="dataSources"
        :initOptions="initOptions"
        :showViewSettings="showViewSettings"
        @update="$emit('update')"
      />
    </div>
  </div>
</template>

<script>
import 'react-chart-editor/lib/react-chart-editor.css'
import GraphEditor from '@/components/Graph/GraphEditor.vue'
import { dataSourceIsValid } from '@/lib/graphHelper'

export default {
  name: 'Graph',
  components: { GraphEditor },
  props: {
    dataSources: Object,
    initOptions: Object,
    exportToPngEnabled: Boolean,
    exportToSvgEnabled: Boolean,
    exportToHtmlEnabled: Boolean,
    showViewSettings: Boolean
  },
  emits: [
    'update:exportToSvgEnabled',
    'update:exportToHtmlEnabled',
    'update:exportToPngEnabled',
    'update:exportToClipboardEnabled',
    'update',
    'loadingImageCompleted'
  ],
  data() {
    return {
      resizeObserver: null
    }
  },
  computed: {
    dataSourceIsValid() {
      return !this.dataSources || dataSourceIsValid(this.dataSources)
    }
  },
  watch: {
    async showViewSettings() {
      await this.$nextTick()
      this.handleResize()
    },
    dataSources() {
      this.$emit('update:exportToPngEnabled', !!this.dataSources)
      this.$emit('update:exportToClipboardEnabled', !!this.dataSources)
    }
  },
  created() {
    this.$emit('update:exportToSvgEnabled', false)
    this.$emit('update:exportToHtmlEnabled', false)
    this.$emit('update:exportToPngEnabled', !!this.dataSources)
    this.$emit('update:exportToClipboardEnabled', !!this.dataSources)
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.$refs.graphContainer)
  },
  beforeUnmount() {
    this.resizeObserver.unobserve(this.$refs.graphContainer)
  },
  methods: {
    getOptionsForSave() {
      return this.$refs.graphEditor.settings
    },
    async saveAsPng() {
      await this.$refs.graphEditor.saveAsPng()
      this.$emit('loadingImageCompleted')
    },
    prepareCopy() {
      return this.$refs.graphEditor.prepareCopy()
    },
    async handleResize() {
      const renderer = this.$refs.graphEditor.renderer
      if (renderer) {
        renderer.refresh()
        renderer.getCamera().animatedReset({ duration: 600 })
      }
    }
  }
}
</script>

<style scoped>
.graph-container {
  height: 100%;
}

.graph {
  min-height: 242px;
}

:deep(.editor_controls .sidebar__item:before) {
  width: 0;
}
</style>
