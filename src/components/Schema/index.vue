<template>
  <div id="schema-container">
    <div id="schema-filter">
      <text-field v-model="filter" placeholder="搜索表" width="100%" />
    </div>
    <div id="db">
      <div class="db-name" @click="schemaVisible = !schemaVisible">
        <tree-chevron v-show="schema.length > 0" :expanded="schemaVisible" />
        {{ dbName }}
      </div>
      <button v-if="isEmbeddedMode" class="save-config-btn" @click="saveConfig" tooltip="保存配置">
        保存
      </button>
    </div>
    <div v-show="schemaVisible" class="schema">
      <table-description
        v-for="table in schema"
        :key="table.name"
        :name="table.name"
        :columns="table.columns"
      />
    </div>
  </div>
</template>

<script>
import TextField from '@/components/Common/TextField';
import TreeChevron from '@/components/svg/treeChevron';
import TableDescription from './TableDescription';

export default {
  name: 'Schema',
  components: {
    TableDescription,
    TextField,
    TreeChevron
  },
  data() {
    return {
      schemaVisible: true,
      filter: null
    }
  },
  computed: {
    schema() {
      // 返回空数组，因为使用后端API
      return []
    },
    dbName() {
      return 'Database'
    },
    isEmbeddedMode() {
      return new URLSearchParams(window.location.search).get('embedded') === '1'
    }
  },
  methods: {
    async saveConfig() {
      const currentTab = this.$store.state.currentTab
      if (!currentTab) {
        alert('没有可保存的配置')
        return
      }

      // 构建配置对象
      const config = {
        sql: currentTab.query,
        viewType: currentTab.viewType,
        viewOptions: currentTab.viewOptions,
        name: currentTab.name || currentTab.tempName
      }

      try {
        // 调用后端API保存配置
        // 这里需要根据实际的后端API地址和认证方式进行调整
        const response = await fetch('/api/save-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(config)
        })

        if (response.ok) {
          const result = await response.json()
          alert('配置保存成功')
          console.log('配置保存成功:', result)
        } else {
          throw new Error('保存失败')
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        if (error.message === 'Failed to fetch') {
          alert('网络请求失败，请稍后重试')
        } else {
          alert('保存配置失败，请稍后重试')
        }
      }
    }
  }
}
</script>

<style scoped>
#schema-container {
  position: relative;
  padding-bottom: 24px;
}

.schema {
  margin-left: 12px;
  padding: 0 12px;
}
#schema-filter {
  padding: 32px 12px;
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  width: 100%;
  height: 100px;
  box-sizing: border-box;
  background-image: linear-gradient(white 73%, rgba(255, 255, 255, 0));
  z-index: 2;
}
.schema,
.db-name {
  color: var(--color-text-base);
  font-size: 13px;
  white-space: nowrap;
}
#db {
  display: flex;
  align-items: center;
  margin-top: -5px;
  padding: 0 12px;
}

.db-name {
  cursor: pointer;
  margin-right: 6px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.save-config-btn {
  padding: 4px 8px;
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
}

.save-config-btn:hover {
  background-color: var(--color-accent-hover);
}

.db-name:hover .chevron-icon path,
:deep(.table-name:hover .chevron-icon path) {
  fill: var(--color-gray-dark);
}
</style>
