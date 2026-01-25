<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>仪表板</h1>
      <button class="primary" @click="createDashboard" v-if="!previewMode">创建新仪表板</button>
    </div>
    
    <!-- 仪表板列表 -->
    <div class="dashboard-list" v-if="!selectedDashboard && !previewMode">
      <h2>我的仪表板</h2>
      <div class="dashboard-cards">
        <div 
          v-for="dashboard in dashboards" 
          :key="dashboard.id" 
          class="dashboard-card"
        >
          <div class="dashboard-card-header">
            <h3>{{ dashboard.name }}</h3>
            <div class="dashboard-card-actions">
              <a href="#" class="action-link edit-link" @click.prevent="editDashboard(dashboard)">编辑</a>
              <a href="#" class="action-link delete-link" @click.prevent="deleteDashboard(dashboard.id)">删除</a>
            </div>
          </div>
          <p>{{ dashboard.description }}</p>
          <div class="dashboard-card-footer">
            <button class="primary" @click="previewDashboard(dashboard)">预览</button>
            <button class="secondary" @click="copyDashboardLink(dashboard)">复制链接</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 仪表板编辑和显示 -->
    <div class="dashboard-edit" v-else-if="selectedDashboard && !previewMode">
      <div class="dashboard-edit-header">
        <button class="secondary" @click="backToList">返回列表</button>
        <h2>{{ selectedDashboard.name }}</h2>
        <button class="primary" @click="saveDashboard">保存</button>
      </div>
      
      <!-- 仪表板配置 -->
      <div class="dashboard-config">
        <h3>仪表板配置</h3>
        <div class="form-row">
          <text-field 
            v-model="selectedDashboard.name" 
            label="仪表板名称" 
            width="300px"
          />
        </div>
        <div class="form-row">
          <text-field 
            v-model="selectedDashboard.description" 
            label="仪表板描述" 
            width="300px"
          />
        </div>
      </div>
      
      <!-- 仪表板部件配置 -->
      <div class="dashboard-widgets">
        <h3>仪表板部件</h3>
        <div class="widgets-controls">
          <button class="primary" @click="addWidget">添加部件</button>
        </div>
        
        <div class="widgets-list">
          <div 
            v-for="(widget, index) in selectedDashboard.widgets" 
            :key="widget.id" 
            class="widget-item"
            :class="{ 'widget-item-selected': selectedWidgetId === widget.id }"
          >
            <div class="widget-header" @click="toggleWidgetExpanded(widget.id)">
              <div class="widget-header-left">
                <button class="toggle-btn" :class="{ 'expanded': isWidgetExpanded(widget.id) }">
                  ▼
                </button>
                <h4>部件 {{ index + 1 }}</h4>
              </div>
              <div class="widget-header-right">
                <button class="select-btn" @click.stop="selectWidget(widget.id)">选中</button>
                <button class="delete-btn" @click.stop="removeWidget(index)">删除</button>
              </div>
            </div>
            <div class="widget-config" v-if="isWidgetExpanded(widget.id)">
              <div class="form-row full-row">
                <text-field 
                  v-model="widget.name" 
                  label="部件名称" 
                  width="200px"
                  @focus="selectWidget(widget.id)"
                />
                <text-field 
                  v-model="widget.url" 
                  label="报表URL" 
                  width="400px"
                  @focus="selectWidget(widget.id)"
                />
                <text-field 
                  v-model.number="widget.width" 
                  label="宽度 (1-12)" 
                  width="120px"
                  @focus="selectWidget(widget.id)"
                />
                <text-field 
                  v-model.number="widget.height" 
                  label="高度 (px)" 
                  width="120px"
                  @focus="selectWidget(widget.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 仪表板预览 -->
      <div class="dashboard-preview">
        <h3>仪表板预览</h3>
        <div class="dashboard-grid">
          <div 
            v-for="widget in selectedDashboard.widgets" 
            :key="widget.id" 
            class="dashboard-grid-item"
            :style="{ 
              gridColumn: `span ${widget.width}`,
              height: `${widget.height}px`
            }"
            :class="{ 'dashboard-grid-item-selected': selectedWidgetId === widget.id }"
          >
            <div class="widget-title">{{ widget.name }}</div>
            <iframe 
              :src="widget.url" 
              :title="widget.name" 
              class="widget-iframe"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 仪表板预览 -->
    <div class="dashboard-preview-mode" v-if="previewMode">
      <div class="dashboard-preview-header" v-if="!isFullscreen">
        <button class="secondary" @click="exitPreview">退出预览</button>
        <h2>{{ currentPreviewDashboard.name }}</h2>
        <div class="dashboard-preview-actions">
          <button class="secondary" @click="copyDashboardLink(currentPreviewDashboard)">复制链接</button>
          <button class="secondary" @click="toggleFullscreen">全屏</button>
        </div>
      </div>
      
      <!-- 浮动退出全屏按钮 -->
      <button class="exit-fullscreen-btn" v-if="isFullscreen" @click="toggleFullscreen">
        退出全屏
      </button>
      
      <div class="dashboard-preview-content" :class="{ 'fullscreen': isFullscreen }">
        <div class="dashboard-grid">
          <div 
            v-for="widget in currentPreviewDashboard.widgets" 
            :key="widget.id" 
            class="dashboard-grid-item"
            :style="{ 
              gridColumn: `span ${widget.width}`,
              height: `${widget.height}px`
            }"
          >
            <div class="widget-title">{{ widget.name }}</div>
            <iframe 
              :src="widget.url" 
              :title="widget.name" 
              class="widget-iframe"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建仪表板对话框 -->
    <modal modalId="create-dashboard" class="dialog" contentStyle="width: 560px;">
      <div class="dialog-header">
        创建新仪表板
        <close-icon @click="cancelCreate" />
      </div>
      <div class="dialog-body">
        <text-field 
          v-model="newDashboard.name" 
          label="仪表板名称" 
          :errorMsg="dashboardError" 
          width="100%"
        />
        <text-field 
          v-model="newDashboard.description" 
          label="仪表板描述" 
          width="100%"
        />
      </div>
      <div class="dialog-buttons-container">
        <button class="secondary" @click="cancelCreate">取消</button>
        <button class="primary" @click="validateAndCreateDashboard">创建</button>
      </div>
    </modal>
  </div>
</template>

<script>
import TextField from '@/components/Common/TextField';
import CloseIcon from '@/components/svg/close';
import { nanoid } from 'nanoid';

export default {
  name: 'Dashboard',
  components: {
    TextField,
    CloseIcon
  },
  data() {
    return {
      dashboards: [],
      selectedDashboard: null,
      previewMode: false,
      currentPreviewDashboard: null, // 重命名，避免与函数名冲突
      isFullscreen: false, // 全屏模式状态
      newDashboard: {
        name: '',
        description: ''
      },
      dashboardError: null,
      widgetExpanded: {}, // 存储每个部件的折叠状态
      selectedWidgetId: null // 当前选中的部件ID
    }
  },
  computed: {
    // 从store获取仪表板数据
    storedDashboards() {
      return this.$store.state.dashboards || []
    }
  },
  created() {
    // 初始化仪表板数据
    this.dashboards = this.storedDashboards
    
    // 处理URL参数，直接进入预览模式
    const urlParams = new URLSearchParams(window.location.hash.slice(1))
    const dashboardId = urlParams.get('view')
    if (dashboardId) {
      const dashboard = this.dashboards.find(d => d.id === dashboardId)
      if (dashboard) {
        this.previewDashboard(dashboard)
      }
    }
    
    // 添加键盘事件监听
    window.addEventListener('keydown', this.handleKeydown)
  },
  
  beforeUnmount() {
    // 移除键盘事件监听
    window.removeEventListener('keydown', this.handleKeydown)
  },
  methods: {
    createDashboard() {
      this.newDashboard = {
        name: '',
        description: ''
      }
      this.dashboardError = null
      this.$modal.show('create-dashboard')
    },
    
    cancelCreate() {
      this.$modal.hide('create-dashboard')
    },
    
    validateAndCreateDashboard() {
      if (!this.newDashboard.name) {
        this.dashboardError = '仪表板名称不能为空'
        return
      }
      
      const dashboard = {
        id: nanoid(),
        name: this.newDashboard.name,
        description: this.newDashboard.description,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      this.dashboards.push(dashboard)
      this.$store.commit('setDashboards', this.dashboards)
      this.$modal.hide('create-dashboard')
    },
    
    selectDashboard(dashboard) {
      // 深拷贝，避免直接修改store数据
      this.selectedDashboard = JSON.parse(JSON.stringify(dashboard))
    },
    
    backToList() {
      this.selectedDashboard = null
    },
    
    editDashboard(dashboard) {
      this.selectDashboard(dashboard)
    },
    
    deleteDashboard(dashboardId) {
      if (confirm('确定要删除这个仪表板吗？')) {
        this.dashboards = this.dashboards.filter(d => d.id !== dashboardId)
        this.$store.commit('setDashboards', this.dashboards)
      }
    },
    
    saveDashboard() {
      this.selectedDashboard.updatedAt = new Date().toISOString()
      
      // 更新仪表板列表
      const index = this.dashboards.findIndex(d => d.id === this.selectedDashboard.id)
      if (index !== -1) {
        this.dashboards[index] = this.selectedDashboard
      } else {
        this.dashboards.push(this.selectedDashboard)
      }
      
      this.$store.commit('setDashboards', this.dashboards)
      alert('仪表板已保存')
    },
    
    selectWidget(widgetId) {
      this.selectedWidgetId = widgetId
    },
    
    isWidgetExpanded(widgetId) {
      // 默认为展开状态
      return this.widgetExpanded[widgetId] !== false
    },
    
    toggleWidgetExpanded(widgetId) {
      this.widgetExpanded[widgetId] = !this.isWidgetExpanded(widgetId)
    },
    
    addWidget() {
      if (!this.selectedDashboard.widgets) {
        this.selectedDashboard.widgets = []
      }
      
      this.selectedDashboard.widgets.push({
        id: nanoid(),
        name: `部件 ${this.selectedDashboard.widgets.length + 1}`,
        url: '',
        width: 6, // 默认宽度为6列
        height: 300 // 默认高度300px
      })
    },
    
    removeWidget(index) {
      this.selectedDashboard.widgets.splice(index, 1)
      // 如果删除的是当前选中的部件，清空选中状态
      if (this.selectedWidgetId === this.selectedDashboard.widgets[index]?.id) {
        this.selectedWidgetId = null
      }
    },
    
    copyDashboardLink(dashboard) {
      const dashboardUrl = `${window.location.origin}${window.location.pathname}#/dashboard?view=${dashboard.id}`
      navigator.clipboard.writeText(dashboardUrl)
        .then(() => {
          alert('仪表板链接已复制到剪贴板')
        })
        .catch(err => {
          console.error('复制链接失败:', err)
          alert('复制链接失败，请手动复制')
        })
    },
    
    previewDashboard(dashboard) {
      this.previewMode = true
      this.currentPreviewDashboard = dashboard
    },
    
    exitPreview() {
      this.previewMode = false
      this.currentPreviewDashboard = null
      this.isFullscreen = false // 退出预览时同时退出全屏
    },
    
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
    },
    
    handleKeydown(event) {
      if (event.key === 'Escape' && this.isFullscreen) {
        this.isFullscreen = false
      }
    },
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text-base);
}

.dashboard-list h2 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--color-text-base);
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dashboard-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
  border-color: #1890ff;
}

.dashboard-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dashboard-card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
  flex: 1;
}

.dashboard-card-actions {
  display: flex;
  gap: 16px;
}

.action-link {
  font-size: 14px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.edit-link {
  color: #1890ff;
}

.edit-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.delete-link {
  color: #ff4d4f;
}

.delete-link:hover {
  color: #ff7875;
  text-decoration: underline;
}

.dashboard-card p {
  margin: 0;
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
  flex: 1;
}

.dashboard-card-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

.dashboard-card-footer button {
  margin: 0;
}

.dashboard-edit {
  background-color: white;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow-1);
}

.dashboard-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-edit-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-base);
}

.dashboard-config,
.dashboard-widgets {
  margin-bottom: 30px;
  padding: 20px;
  background-color: var(--color-bg-light);
  border-radius: 8px;
}

.dashboard-config h3,
.dashboard-widgets h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: var(--color-text-base);
}

.form-row {
  margin-bottom: 15px;
}

.widgets-controls {
  margin-bottom: 20px;
}

.widgets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.widget-item {
  background-color: white;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 15px;
}

.widget-item-selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
}

.widget-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.widget-header-right {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn.expanded {
  transform: rotate(180deg);
}

.widget-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-base);
}

.select-btn {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 4px;
}

.select-btn:hover {
  background-color: rgba(24, 144, 255, 0.1);
}

.delete-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 14px;
  padding: 5px 10px;
  border-radius: 4px;
}

.delete-btn:hover {
  background-color: rgba(255, 77, 79, 0.1);
}

.widget-config {
  padding: 15px 0;
}

.form-row.full-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.dashboard-grid-item {  
  background-color: white;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-1);
  transition: all 0.2s ease;
}

.dashboard-grid-item-selected {
  border-color: #1890ff !important;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.3) !important;
  background-color: rgba(24, 144, 255, 0.05) !important;
  transform: translateY(-2px);
}

.dashboard-preview {
  margin-top: 30px;
}

.dashboard-preview h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: var(--color-text-base);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  background-color: var(--color-bg-light);
  padding: 20px;
  border-radius: 8px;
}

.dashboard-grid-item {
  background-color: white;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow-1);
}

.widget-title {
  padding: 10px;
  background-color: var(--color-bg-light);
  border-bottom: 1px solid var(--color-border-light);
  font-size: 14px;
  font-weight: bold;
  color: var(--color-text-base);
}

.widget-iframe {
  width: 100%;
  height: calc(100% - 40px);
  border: none;
}

/* 预览模式样式 */
.dashboard-preview-mode {
  padding: 20px;
  background-color: white;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-1);
}

.dashboard-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 20px;
}

.dashboard-preview-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text-base);
}

.dashboard-preview-content {
  padding: 20px;
  background-color: var(--color-bg-light);
  border-radius: 8px;
  transition: all 0.3s ease;
}

/* 全屏模式样式 */
.dashboard-preview-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 移除width和height设置，使用left/right/top/bottom即可 */
  padding: 20px;
  background-color: var(--color-bg-light);
  border-radius: 0;
  z-index: 9999;
  overflow: auto;
  box-sizing: border-box; /* 确保padding包含在元素尺寸内 */
}

.dashboard-preview-content.fullscreen .dashboard-grid {
  padding: 0; /* 移除额外的padding，避免嵌套padding导致的不对称 */
}

/* 浮动退出全屏按钮样式 */
.exit-fullscreen-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(24, 144, 255, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.exit-fullscreen-btn:hover {
  background-color: #40a9ff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 预览操作按钮容器 */
.dashboard-preview-actions {
  display: flex;
  gap: 10px;
}</style>