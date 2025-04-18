const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    USER_INFO: '/api/user/info',
    PRODUCTS: '/api/products',
  } as const;
  
  // 使用 typeof 和 keyof 提取类型
  export type ApiEndpoints = typeof API_ENDPOINTS;
  export default API_ENDPOINTS;