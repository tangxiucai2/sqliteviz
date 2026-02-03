// src/config/index.js
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// 获取运行时的API基础URL
const getRuntimeBaseUrl = () => {
  // 1. 从URL参数获取（iframe方式优先）
  const urlParams = new URLSearchParams(window.location.search);
  const urlBaseUrl = urlParams.get('apiBaseUrl');
  if (urlBaseUrl) {
    return urlBaseUrl;
  }
  
  // 2. 检查是否存在全局配置（由目标项目注入）
  if (window.sqlitevizConfig && window.sqlitevizConfig.apiBaseUrl) {
    return window.sqlitevizConfig.apiBaseUrl;
  }
  
  // 3. 使用环境变量
  return apiBaseUrl;
};

// 智能处理API前缀
const getApiPrefix = () => {
  const baseUrl = getRuntimeBaseUrl();
  // 检查baseUrl是否已经包含/api前缀
  if (baseUrl.includes('/soag/api')) {
    return ''; // 已经包含前缀，不需要再添加
  }
  return '/soag/api'; // 未包含前缀，需要添加
};

export const config = {
  backend: {
    get baseUrl() {
      return getRuntimeBaseUrl();
    },
    get apiPrefix() {
      return getApiPrefix();
    },
    endpoints: {
      executeSql: 'database/query',
      report: {
        list: 'infra/report',
        detail: 'infra/report'
      }
    }
  }
};

export default config;