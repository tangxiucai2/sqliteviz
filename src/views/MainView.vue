<template>
  <div>
    <main-menu />
    <router-view id="main-view" v-slot="{ Component }">
      <keep-alive include="Workspace,Inquiries,Dashboard">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script>
import '@/assets/styles/scrollbars.css';
import MainMenu from '@/components/MainMenu';

export default {
  name: 'MainView',
  components: { MainMenu }
}
</script>

<style scoped>
#main-view {
  margin-top: 68px;
  height: calc(100vh - 68px);
  overflow-y: auto;
}

/* 嵌入模式样式 */
#app[data-embedded="true"] #main-view {
  margin-top: 10px;
  height: calc(100vh - 10px);
}
</style>
