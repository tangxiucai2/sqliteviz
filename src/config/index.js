export const config = {
  backend: {
    // 后端服务的基础URL，用于开发环境可以设置为 http://localhost:3000
    // 生产环境可以设置为完整的域名，如 https://example.com
    baseUrl: 'http://localhost:5200',
    // API前缀，如 '/soag/api'
    apiPrefix: '/soag/api',
    // API端点配置
    endpoints: {
      executeSql: 'database/execute',
      // 查询报表相关接口
      inquiries: {
        list: 'inquiries/list',
        rename: 'inquiries/rename',
        delete: 'inquiries/delete',
        copy: 'inquiries/copy',
        export: 'inquiries/export'
      }
    }
  }
}

export default config
