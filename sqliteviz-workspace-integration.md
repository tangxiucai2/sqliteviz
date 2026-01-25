# SQLiteViz 工作区功能集成方案

## 1. 项目概况

### 1.1 源项目（SQLiteViz）
- **技术栈**：Vue 3、Vuex、JavaScript
- **核心功能**：工作区、查询管理、仪表板
- **工作区组件**：Workspace、Schema、Tabs、Tab、SqlEditor、RunResult 等

### 1.2 目标项目（orion-visor-ui）
- **技术栈**：Vue 3 + TypeScript、Pinia、Arco Design
- **现有依赖**：已包含 codemirror、axios 等相关库
- **集成需求**：在不进行大规模调整的情况下集成工作区功能

## 2. 集成方案设计

### 2.1 组件封装方案

#### 2.1.1 封装策略
- 将工作区相关组件封装为独立的 Vue 插件
- 使用组件前缀 `Sqliteviz` 避免命名冲突
- 支持按需引入和全局注册
- 提供灵活的配置选项

#### 2.1.2 核心组件结构
```
sqliteviz-workspace/
├── components/
│   ├── SqlitevizWorkspace.vue      # 工作区主组件
│   ├── SqlitevizSchema.vue          # 数据库 schema 组件
│   ├── SqlitevizTabs.vue            # 标签页管理组件
│   ├── SqlitevizTab.vue             # 单个标签页组件
│   ├── SqlitevizSqlEditor.vue       # SQL 编辑器组件
│   ├── SqlitevizRunResult.vue       # 运行结果组件
│   └── SqlitevizDataView.vue        # 数据可视化组件
├── store/
│   └── workspace.ts                 # Pinia 状态管理
├── utils/
│   ├── events.ts                    # 事件管理
│   └── helpers.ts                   # 工具函数
├── index.ts                         # 插件入口
└── types.ts                         # TypeScript 类型定义
```

#### 2.1.3 插件配置选项
```typescript
interface SqlitevizWorkspaceOptions {
  /** API 基础 URL */
  apiBaseUrl?: string;
  /** 是否启用默认路由 */
  enableDefaultRoutes?: boolean;
  /** 主题配置 */
  theme?: {
    /** 主色调 */
    primaryColor?: string;
    /** 背景色 */
    backgroundColor?: string;
    /** 文本色 */
    textColor?: string;
  };
  /** 权限控制回调 */
  permissionChecker?: (action: string) => boolean;
}
```

### 2.2 状态管理集成方案

#### 2.2.1 从 Vuex 到 Pinia 的转换
- 将原有的 Vuex store 转换为 Pinia store
- 保持状态结构不变，确保组件兼容性
- 使用 Pinia 的模块化特性，便于集成到目标项目

#### 2.2.2 Pinia Store 设计
```typescript
// workspace.ts
import { defineStore } from 'pinia';

export const useSqlitevizWorkspaceStore = defineStore('sqlitevizWorkspace', {
  state: () => ({
    tabs: [],
    currentTab: null,
    currentTabId: null,
    untitledLastIndex: 0,
    inquiries: [],
    predefinedInquiries: [],
    loadingPredefinedInquiries: false,
    predefinedInquiriesLoaded: false,
    db: null,
    isWorkspaceVisible: false,
    dashboards: []
  }),
  getters: {
    // 计算属性
  },
  actions: {
    // 异步和同步操作
  }
});
```

### 2.3 路由配置方案

#### 2.3.1 路由配置工厂函数
- 提供一个路由配置工厂函数，支持自定义路由路径和权限控制
- 与目标项目的路由系统无缝集成

#### 2.3.2 路由配置示例
```typescript
// 目标项目路由配置
import { createRouter } from 'vue-router';
import { generateSqlitevizRoutes } from 'sqliteviz-workspace';

const router = createRouter({
  // ...
});

// 生成工作区路由并添加到路由表
const sqlitevizRoutes = generateSqlitevizRoutes({
  /** 基础路径 */
  basePath: '/workspace',
  /** 权限控制 */
  meta: {
    requiresAuth: true,
    roles: ['admin', 'editor']
  }
});

router.addRoute(sqlitevizRoutes);
```

### 2.4 样式隔离方案

#### 2.4.1 样式设计原则
- **隔离性**：确保工作区样式不会影响目标项目其他组件
- **兼容性**：与目标项目使用的 Arco Design 样式兼容
- **可定制性**：支持主题定制和样式覆盖
- **性能**：优化样式加载，支持按需加载

#### 2.4.2 样式隔离策略

##### 2.4.2.1 CSS 命名空间
- 所有 CSS 类名使用 `sqliteviz-` 前缀，避免命名冲突
- 示例：`sqliteviz-workspace`, `sqliteviz-tabs`, `sqliteviz-sql-editor`

##### 2.4.2.2 Scoped 样式
- 所有 Vue 组件使用 `scoped` 样式
- 结合 CSS 命名空间，双重保障样式隔离

```vue
<!-- 组件样式示例 -->
<style scoped>
.sqliteviz-workspace {
  /* 样式定义 */
}
</style>
```

##### 2.4.2.3 CSS 变量
- 使用 CSS 变量定义主题样式，支持动态切换
- 与 Arco Design 的 CSS 变量命名规范兼容
- 支持从目标项目继承主题变量

```css
/* 主题变量定义 */
:root {
  /* 基础颜色 */
  --sqliteviz-color-primary: var(--color-primary, #165DFF);
  --sqliteviz-color-success: var(--color-success, #00B42A);
  --sqliteviz-color-warning: var(--color-warning, #FF7D00);
  --sqliteviz-color-danger: var(--color-danger, #F53F3F);
  
  /* 背景颜色 */
  --sqliteviz-bg-light: var(--color-bg-light, #F7F8FA);
  --sqliteviz-bg-white: var(--color-white, #FFFFFF);
  
  /* 文本颜色 */
  --sqliteviz-text-base: var(--color-text-base, #1D2129);
  --sqliteviz-text-light: var(--color-text-light-1, #86909C);
  
  /* 边框颜色 */
  --sqliteviz-border-light: var(--color-border-light, #E5E6EB);
  --sqliteviz-border-base: var(--color-border, #D9D9D9);
}
```

#### 2.4.3 主题适配机制

##### 2.4.3.1 自动继承主题
- 工作区组件自动继承目标项目的 Arco Design 主题
- 通过 CSS 变量 fallback 机制实现

##### 2.4.3.2 主题配置选项
- 支持通过插件配置自定义主题
- 支持运行时主题切换

```typescript
// 主题配置示例
app.use(SqlitevizWorkspacePlugin, {
  theme: {
    primaryColor: '#165DFF',
    backgroundColor: '#F7F8FA',
    textColor: '#1D2129'
  }
});
```

##### 2.4.3.3 主题样式生成

```typescript
// 主题样式生成函数
function generateThemeStyles(theme: SqlitevizThemeOptions): string {
  return `
    :root {
      --sqliteviz-color-primary: ${theme.primaryColor || 'var(--color-primary, #165DFF)'};
      --sqliteviz-bg-light: ${theme.backgroundColor || 'var(--color-bg-light, #F7F8FA)'};
      --sqliteviz-text-base: ${theme.textColor || 'var(--color-text-base, #1D2129)'};
      /* 其他主题变量 */
    }
  `;
}
```

#### 2.4.4 样式加载策略

##### 2.4.4.1 按需加载
- 组件样式与组件捆绑，支持按需加载
- 避免全局样式污染

##### 2.4.4.2 样式优先级
- 工作区样式优先级低于目标项目自定义样式
- 支持通过 `!important` 覆盖（不推荐）

##### 2.4.4.3 字体和图标
- 使用目标项目的字体配置
- 图标使用 Arco Design 的 Icon 组件或自定义 SVG 图标

#### 2.4.5 与 Arco Design 的兼容处理

##### 2.4.5.1 组件样式兼容
- 工作区组件内部使用 Arco Design 组件时，样式自动兼容
- 自定义组件样式与 Arco Design 设计规范保持一致

##### 2.4.5.2 布局兼容
- 工作区组件支持 Arco Design 的栅格布局
- 支持响应式设计，与 Arco Design 的断点系统兼容

```typescript
// 响应式断点配置
export const BREAKPOINTS = {
  xs: '480px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  xxl: '1600px'
};
```

#### 2.4.6 样式调试工具

##### 2.4.6.1 样式检查
- 提供样式检查脚本，确保所有样式使用正确的命名空间
- 支持 CI/CD 集成

```bash
# 样式检查命令
npm run style-check
```

##### 2.4.6.2 主题预览
- 提供主题预览功能，支持实时调整主题变量
- 便于开发和调试

### 2.5 API 集成方案

#### 2.5.1 API 适配器
- 创建 API 适配器，支持自定义 API 调用方式
- 兼容目标项目的 HTTP 客户端
- 支持 API 路径和参数映射

#### 2.5.2 API 配置示例
```typescript
// 插件初始化时配置 API 适配器
app.use(SqlitevizWorkspacePlugin, {
  apiAdapter: {
    getInquiries: async () => {
      // 调用目标项目的 API
      const response = await apiClient.get('/api/inquiries');
      return response.data;
    },
    saveInquiry: async (inquiry) => {
      // 调用目标项目的 API
      const response = await apiClient.post('/api/inquiries', inquiry);
      return response.data;
    }
    // 其他 API 方法
  }
});
```

## 3. 集成步骤

### 3.1 安装和配置

#### 3.1.1 安装依赖
```bash
# 使用 npm
npm install sqliteviz-workspace

# 使用 pnpm
pnpm add sqliteviz-workspace
```

#### 3.1.2 全局注册插件
```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import SqlitevizWorkspacePlugin from 'sqliteviz-workspace';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(SqlitevizWorkspacePlugin, {
  apiBaseUrl: '/api/sqliteviz',
  enableDefaultRoutes: true,
  theme: {
    primaryColor: '#165DFF'
  }
});

app.mount('#app');
```

### 3.2 路由集成

#### 3.2.1 添加路由配置
```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { generateSqlitevizRoutes } from 'sqliteviz-workspace';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 其他路由
    ...generateSqlitevizRoutes({
      basePath: '/sql-workspace'
    })
  ]
});
```

### 3.3 组件使用

#### 3.3.1 全局使用
- 通过路由访问工作区功能
- 导航路径：`/sql-workspace`

#### 3.3.2 局部使用
```vue
<!-- 在目标项目组件中使用 -->
<template>
  <div>
    <h1>我的应用</h1>
    <sqliteviz-workspace />
  </div>
</template>

<script setup lang="ts">
import { SqlitevizWorkspace } from 'sqliteviz-workspace';
</script>
```

## 4. 兼容性和迁移策略

### 4.1 技术栈兼容性
- ✅ Vue 3 兼容
- ✅ TypeScript 支持
- ✅ Pinia 兼容（替代 Vuex）
- ✅ Arco Design 样式适配
- ✅ 响应式设计支持

### 4.2 数据迁移策略
- 提供数据迁移工具，支持从原有的 localStorage 迁移到新的存储方案
- 支持与目标项目的用户系统集成
- 提供数据导入/导出功能

## 5. 性能优化

### 5.1 组件懒加载
- 所有组件支持按需加载
- 使用动态导入减少初始包大小
- 支持组件级别的代码分割

### 5.2 状态优化
- 使用 Pinia 的状态持久化功能
- 优化大型查询结果的处理
- 实现虚拟滚动，支持大量数据展示

## 6. 测试和部署

### 6.1 测试策略
- 单元测试：覆盖核心组件和功能
- 集成测试：验证与目标项目的集成效果
- E2E 测试：验证完整的用户流程

### 6.2 部署建议
- 作为独立 npm 包发布
- 支持 CDN 引入
- 提供 Docker 镜像用于开发和测试

## 7. 维护和支持

### 7.1 版本管理
- 遵循语义化版本控制
- 定期更新依赖和修复问题
- 提供迁移指南

### 7.2 支持渠道
- GitHub Issues
- 文档和示例
- 社区支持

## 8. 结论

本集成方案旨在将 SQLiteViz 的工作区功能无缝集成到 orion-visor-ui 项目中，同时最大限度地减少对目标项目的修改。通过组件封装、状态管理转换、路由集成和样式隔离等策略，确保集成过程简单、安全且可维护。

该方案支持灵活的配置选项，可以根据目标项目的需求进行定制，同时保持良好的性能和用户体验。