<template>
  <div id="app-info-container">
    <img
      id="app-info-icon"
      src="~@/assets/images/info.svg"
      @click="$modal.show('app-info')"
    />
    <modal modalId="app-info" class="dialog" contentClass="app-info-modal">
      <div class="dialog-header">
        App info
        <close-icon @click="$modal.hide('app-info')" />
      </div>
      <div class="dialog-body">
        <div v-for="(item, index) in info" :key="index" class="info-item">
          {{ item.name }}
          <div class="divider" />
          <div class="options">
            <div v-for="(opt, optIndex) in item.info" :key="optIndex">
              {{ opt }}
            </div>
          </div>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
import CloseIcon from '@/components/svg/close'
import { version } from '../../package.json'

export default {
  name: 'AppDiagnosticInfo',
  components: { CloseIcon },
  data() {
    return {
      info: [
        {
          name: 'sqliteviz version',
          info: [version]
        }
      ]
    }
  },

  async created() {
    const state = this.$store.state
    try {
      let result = await state.db.execute('select sqlite_version()')
      // 处理不同的API响应格式
      let sqliteVersion = ''
      if (result && result.values) {
        sqliteVersion = result.values['sqlite_version()']
      } else if (result && result[0]) {
        sqliteVersion = result[0]['sqlite_version()'] || result[0].sqlite_version
      } else if (result && typeof result === 'object') {
        sqliteVersion = result['sqlite_version()'] || result.sqlite_version
      }
      this.info.push({
        name: 'SQLite version',
        info: sqliteVersion
      })

      result = await state.db.execute('PRAGMA compile_options')
      // 处理不同的API响应格式
      let compileOptions = []
      if (result && result.values) {
        compileOptions = result.values.compile_options
      } else if (result && Array.isArray(result)) {
        compileOptions = result.map(opt => opt.compile_options || opt)
      } else if (result && result.values && Array.isArray(result.values)) {
        compileOptions = result.values
      }
      this.info.push({
        name: 'SQLite compile options',
        info: compileOptions
      })
    } catch (error) {
      console.error('Failed to get database info:', error)
      // 可以选择不添加这些信息，或者添加错误信息
    }
  }
}
</script>

<style>
.app-info-modal {
  width: 400px;
}
</style>

<style scoped>
#app-info-icon {
  cursor: pointer;
  width: 24px;
}
#app-info-container {
  display: flex;
  justify-content: center;
  margin-left: 32px;
}
.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 4px 0;
}
.options {
  font-family: monospace;
  font-size: 13px;
  margin-left: 8px;
  overflow: auto;
  max-height: 170px;
}
.info-item {
  margin-bottom: 32px;
  font-size: 14px;
}
.info-item:last-child {
  margin-bottom: 0;
}
</style>
