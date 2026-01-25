<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import storedInquiries from '@/lib/storedInquiries'

export default {
  computed: {
    inquiries() {
      return this.$store.state.inquiries
    },
    dashboards() {
      return this.$store.state.dashboards
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
    this.$store.commit('setInquiries', storedInquiries.getStoredInquiries())
    
    // 加载存储的仪表板数据
    const storedDashboards = localStorage.getItem('sqliteviz_dashboards')
    if (storedDashboards) {
      try {
        this.$store.commit('setDashboards', JSON.parse(storedDashboards))
      } catch (e) {
        console.error('Failed to parse stored dashboards:', e)
      }
    }
    
    addEventListener('storage', event => {
      if (event.key === storedInquiries.myInquiriesKey) {
        this.$store.commit('setInquiries', storedInquiries.getStoredInquiries())
      }
      if (event.key === 'sqliteviz_dashboards') {
        try {
          this.$store.commit('setDashboards', JSON.parse(event.newValue || '[]'))
        } catch (e) {
          console.error('Failed to parse stored dashboards from storage event:', e)
        }
      }
    })
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
