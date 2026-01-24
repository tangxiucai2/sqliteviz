export const config = {
  backend: {
    // 后端服务的基础URL，用于开发环境可以设置为 http://localhost:3000
    // 生产环境可以设置为完整的域名，如 https://example.com
    baseUrl: 'http://localhost:5200',
    // API前缀，如 '/soag/api'
    apiPrefix: '/soag/api',
    // API端点配置
    endpoints: {
      executeSql: 'database/execute'
    }
  }
}

export default config
