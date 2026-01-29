<template>
  <div>
    <div v-if="isEmbeddedMode">
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
    }
  },
  async beforeCreate() {
    const schema = this.$store.state.db.schema
    if (
      (!schema || schema.length === 0) &&
      this.$store.state.tabs.length === 0
    ) {
      const stmt = '/* \n * 请输入SQL进行查询 \n */ \n'

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
