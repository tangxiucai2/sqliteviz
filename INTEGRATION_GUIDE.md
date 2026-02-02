# SQLiteViz 集成指南

本指南提供了将 SQLiteViz 项目打包并集成到目标项目 `/Users/helo/bt/SOAG/orion-visor-ui` 中的详细步骤。

## 集成方案

我们提供两种主要集成方案（除 iframe 嵌套外）：

### 方案一：子目录部署

将 SQLiteViz 部署为目标项目的子目录，共享同一域名，避免跨域问题。

### 方案二：组件化集成

将 SQLiteViz 作为组件集成到目标项目中，实现更深度的融合。

## 准备工作

### 1. 修改 SQLiteViz 配置

1. **修改后端接口配置**：
   - 文件：`src/config/index.js`
   - 将 `baseUrl` 设置为空字符串，使用相对路径

2. **修改打包配置**：
   - 文件：`vite.config.js`
   - 确保输出路径使用相对路径

### 2. 构建 SQLiteViz

```bash
npm run build
```

构建完成后，打包文件将生成在 `dist` 目录中。

## 方案一：子目录部署

### 步骤 1：复制打包文件到目标项目

1. 在目标项目的 `public` 目录中创建 `sqliteviz` 子目录：

```bash
mkdir -p /Users/helo/bt/SOAG/orion-visor-ui/public/sqliteviz
```

2. 复制 SQLiteViz 的打包文件到该目录：

```bash
cp -r /Users/helo/bt/sqliteviz/dist/* /Users/helo/bt/SOAG/orion-visor-ui/public/sqliteviz/
```

### 步骤 2：配置目标项目路由

在目标项目的路由配置中添加指向 SQLiteViz 的路由：

文件：`/Users/helo/bt/SOAG/orion-visor-ui/src/router/routes/modules/database-fortress.ts`

```typescript
import { RouteRecordRaw } from 'vue-router';

const databaseFortressRoutes: RouteRecordRaw[] = [
  {
    path: 'sqliteviz',
    name: 'DatabaseSqliteViz',
    meta: {
      title: 'SQLite 可视化工具',
      icon: 'icon-database',
      requiresAuth: true,
    },
    // 使用 redirect 重定向到静态文件
    redirect: '/public/sqliteviz/index.html',
  },
  // 其他数据库堡垒路由...
];

export default databaseFortressRoutes;
```

### 步骤 3：配置 Nginx（生产环境）

如果使用 Nginx 作为反向代理，确保配置正确处理子目录：

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    root /path/to/orion-visor-ui/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
  }

  location /sqliteviz {
    alias /path/to/orion-visor-ui/dist/sqliteviz;
    try_files $uri $uri/ /sqliteviz/index.html;
  }

  # API 代理配置，确保后端接口调用不跨域
  location /soag/api {
    proxy_pass http://localhost:5200/soag/api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## 方案二：组件化集成

### 步骤 1：创建 SQLiteViz 组件包装器

在目标项目中创建一个组件包装器：

文件：`/Users/helo/bt/SOAG/orion-visor-ui/src/components/sqliteviz/SqliteVizWrapper.vue`

```vue
<template>
  <div class="sqliteviz-wrapper">
    <!-- 加载 SQLiteViz 样式 -->
    <link rel="stylesheet" href="/sqliteviz/assets/css/index.css">
    <link rel="stylesheet" href="/sqliteviz/assets/css/vendor.css">
    <link rel="stylesheet" href="/sqliteviz/assets/css/maps.css">
    
    <!-- SQLiteViz 容器 -->
    <div id="sqliteviz-app"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  // 动态加载 SQLiteViz 脚本
  const script = document.createElement('script');
  script.src = '/sqliteviz/assets/js/index.js';
  script.type = 'module';
  document.body.appendChild(script);
});

onUnmounted(() => {
  // 清理资源
  const sqlitevizApp = document.getElementById('sqliteviz-app');
  if (sqlitevizApp) {
    sqlitevizApp.innerHTML = '';
  }
});
</script>

<style scoped>
.sqliteviz-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#sqliteviz-app {
  width: 100%;
  height: 100%;
}
</style>
```

### 步骤 2：配置目标项目路由

在目标项目的路由配置中添加 SQLiteViz 组件路由：

文件：`/Users/helo/bt/SOAG/orion-visor-ui/src/router/routes/modules/database-fortress.ts`

```typescript
import { RouteRecordRaw } from 'vue-router';
import SqliteVizWrapper from '@/components/sqliteviz/SqliteVizWrapper.vue';

const databaseFortressRoutes: RouteRecordRaw[] = [
  {
    path: 'sqliteviz',
    name: 'DatabaseSqliteViz',
    component: SqliteVizWrapper,
    meta: {
      title: 'SQLite 可视化工具',
      icon: 'icon-database',
      requiresAuth: true,
    },
  },
  // 其他数据库堡垒路由...
];

export default databaseFortressRoutes;
```

### 步骤 3：复制打包文件到目标项目

1. 在目标项目的 `public` 目录中创建 `sqliteviz` 子目录：

```bash
mkdir -p /Users/helo/bt/SOAG/orion-visor-ui/public/sqliteviz
```

2. 复制 SQLiteViz 的打包文件到该目录：

```bash
cp -r /Users/helo/bt/sqliteviz/dist/* /Users/helo/bt/SOAG/orion-visor-ui/public/sqliteviz/
```

## 后端接口配置

### 避免跨域问题的配置

由于我们已经将 `baseUrl` 设置为空字符串，SQLiteViz 将使用相对路径调用后端接口，例如：

- 原调用：`http://localhost:5200/soag/api/database/query`
- 现在调用：`/soag/api/database/query`

这样，当集成到目标项目后，接口调用将使用与目标项目相同的域名，避免跨域问题。

### 目标项目后端配置

确保目标项目的后端服务能够处理 SQLiteViz 的接口请求：

1. **API 路径**：确保目标项目的后端服务监听 `/soag/api` 路径
2. **接口实现**：确保实现了以下接口：
   - `/soag/api/database/query` - 执行 SQL 查询
   - `/soag/api/inquiries/list` - 获取查询历史
   - `/soag/api/inquiries/rename` - 重命名查询
   - `/soag/api/inquiries/delete` - 删除查询
   - `/soag/api/inquiries/copy` - 复制查询
   - `/soag/api/inquiries/export` - 导出查询

## 测试集成

### 开发环境测试

1. 启动目标项目：

```bash
cd /Users/helo/bt/SOAG/orion-visor-ui
npm run dev
```

2. 访问 SQLiteViz 页面：
   - 路径：`http://localhost:3000/#/database-fortress/sqliteviz`（根据目标项目的实际端口和路由调整）

3. 测试功能：
   - 执行 SQL 查询
   - 保存查询历史
   - 导出查询结果

### 生产环境测试

1. 构建目标项目：

```bash
cd /Users/helo/bt/SOAG/orion-visor-ui
npm run build
```

2. 部署到生产环境
3. 测试所有功能是否正常工作

## 常见问题

### 1. 静态资源加载失败

**解决方法**：确保静态资源路径正确，检查打包文件是否正确复制到目标项目。

### 2. 后端接口调用失败

**解决方法**：
- 检查浏览器控制台的网络请求
- 确保后端服务正常运行
- 确保 API 路径配置正确

### 3. 样式冲突

**解决方法**：
- 在组件包装器中使用 Shadow DOM 隔离样式
- 或修改 SQLiteViz 的样式前缀，避免与目标项目冲突

## 总结

本指南提供了两种将 SQLiteViz 集成到目标项目的方案：

1. **子目录部署**：简单直接，适合快速集成，避免跨域问题
2. **组件化集成**：更深度融合，适合需要与目标项目紧密集成的场景

两种方案都能有效避免跨域问题，因为它们共享同一域名，后端接口调用使用相对路径。

根据实际需求选择合适的集成方案，并按照本指南的步骤进行操作。