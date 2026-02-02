<template>
  <div class="side-tool-bar">
    <slot />

    <div v-if="$slots.default" class="side-tool-bar-divider" />



    <icon-button
      ref="tableBtn"
      :active="panel === 'table'"
      tooltip="切换到结果集面板"
      tooltipPosition="top-left"
      @click="$emit('switchTo', 'table')"
    >
      <table-icon />
    </icon-button>

    <icon-button
      ref="dataViewBtn"
      :active="panel === 'dataView'"
      tooltip="切换到数据视图面板"
      tooltipPosition="top-left"
      @click="$emit('switchTo', 'dataView')"
    >
      <data-view-icon />
    </icon-button>
  </div>
</template>

<script>
import IconButton from '@/components/Common/IconButton';
import DataViewIcon from '@/components/svg/dataView';
import SqlEditorIcon from '@/components/svg/sqlEditor';
import TableIcon from '@/components/svg/table';

export default {
  name: 'SideToolBar',
  components: {
    IconButton,
    SqlEditorIcon,
    DataViewIcon,
    TableIcon
  },
  props: {
    panel: String
  },
  emits: ['switchTo']
}
</script>

<style scoped>
.side-tool-bar {
  background-color: var(--color-bg-light);
  border-left: 1px solid var(--color-border-light);
  padding: 6px;
}
</style>

<style>
.side-tool-bar-divider {
  width: 26px;
  height: 1px;
  background: var(--color-border-light);
  margin: 6px 0;
}
</style>
