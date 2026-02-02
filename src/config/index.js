// 获取环境变量中的API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

// 获取运行时的API基础URL（从目标项目注入）
const getRuntimeBaseUrl = () => {
  // 检查是否存在全局配置（由目标项目注入）
  if (window.sqlitevizConfig && window.sqlitevizConfig.apiBaseUrl) {
    return window.sqlitevizConfig.apiBaseUrl;
  }
  return apiBaseUrl;
};

export const config = {
  backend: {
    // 后端服务的基础URL
    get baseUrl() {
      return getRuntimeBaseUrl();
    },
    // API前缀，如 '/soag/api'
    apiPrefix: '/soag/api',
    // API端点配置
    endpoints: {
      executeSql: 'database/query',
      // 报表相关接口
      report: {
        list: 'infra/report',
        detail: 'infra/report'
      }
    }
  }
};

export default config
