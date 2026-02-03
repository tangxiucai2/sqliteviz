<template>
  <div>
    <div v-if="isReportMode">
      <!-- 报表模式下只显示数据视图内容 -->
      <div class="report-mode-container">
        <tabs />
      </div>
    </div>
    <div v-else-if="isEmbeddedMode">
      <!-- 嵌入模式下直接显示标签页内容，不使用splitpanes -->
      <tabs />
    </div>
    <splitpanes
      v-else
      class="schema-tabs-splitter"
      :before="{ size: schemaWidth, max: 30, resizable: true }"
      :after="{ size: 100 - schemaWidth, max: 100 }"
      :default="{ before: 20, after: 80 }"
    >
      <template #left-pane>
        <schema />
      </template>
      <template #right-pane>
        <tabs />
      </template>
    </splitpanes>
  </div>
</template>

<script>
import Splitpanes from '@/components/Common/Splitpanes';
import Schema from '@/components/Schema';
import Tabs from '@/components/Tabs';
import events from '@/lib/utils/events';

export default {
  name: 'Workspace',
  components: {
    Schema,
    Splitpanes,
    Tabs
  },
  data() {
    const isEmbeddedMode = new URLSearchParams(window.location.search).get('embedded') === '1'
    return {
      schemaWidth: this.$route.query.hide_schema === '1' || isEmbeddedMode ? 0 : 20
    }
  },
  computed: {
    isEmbeddedMode() {
      return new URLSearchParams(window.location.search).get('embedded') === '1'
    },
    isReportMode() {
      return new URLSearchParams(window.location.search).get('mode') === 'report'
    }
  },
  async beforeCreate() {
    // 简化逻辑，只根据tabs长度决定是否创建新标签页
    // 嵌入模式和报表模式下不创建新标签页，因为 App.vue 已经会创建
    const isEmbeddedMode = new URLSearchParams(window.location.search).get('embedded') === '1'
    const isReportMode = new URLSearchParams(window.location.search).get('mode') === 'report'
    
    if (!isEmbeddedMode && !isReportMode && this.$store.state.tabs.length === 0) {
      const stmt = ''

      const tabId = await this.$store.dispatch('addTab', { query: stmt })
      this.$store.commit('setCurrentTabId', tabId)

      events.send('inquiry.create', null, { auto: true })
    }
  },
  activated() {
    this.$store.commit('setIsWorkspaceVisible', true)
  },
  deactivated() {
    this.$store.commit('setIsWorkspaceVisible', false)
  }
}
</script>

<style scoped>
.schema-tabs-splitter {
  height: 100%;
  background-color: var(--color-white);
}
</style>
