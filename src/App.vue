<template>
  <div id="app" :data-embedded="isEmbeddedMode">
    <router-view />
  </div>
</template>

<script>
import storedInquiries from '@/lib/storedInquiries';

export default {
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
    
    // 检查是否为嵌入模式，如果是则加载保存的配置
    this.loadSavedConfig()
    
    addEventListener('storage', event => {
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
    })
  },
  methods: {
    async loadSavedConfig() {
      const isEmbeddedMode = new URLSearchParams(window.location.search).get('embedded') === '1'
      if (!isEmbeddedMode) return

      try {
        // 调用后端API获取保存的配置
        // 这里需要根据实际的后端API地址和认证方式进行调整
        const response = await fetch('/api/get-config')
        
        if (response.ok) {
          const config = await response.json()
          if (config) {
            // 创建新标签页并恢复配置
            const tabId = await this.$store.dispatch('addTab', {
              query: config.sql,
              name: config.name,
              viewType: config.viewType,
              viewOptions: config.viewOptions
            })
            this.$store.commit('setCurrentTabId', tabId)
            console.log('配置加载成功:', config)
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        // 加载失败时不影响应用启动
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
  font-family: 'Open Sans', Helvetica, Arial, sans-serif;
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
