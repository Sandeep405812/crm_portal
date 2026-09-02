import axiosClient from './axiosClient';

// Auth Services
export const authService = {
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  register: (data) => axiosClient.post('/auth/register', data),
  getMe: () => axiosClient.get('/auth/me'),
  getUsers: () => axiosClient.get('/auth/users'),
};

// Customer Services
export const customerService = {
  getCustomers: (params) => axiosClient.get('/customers', { params }),
  getCustomerById: (id) => axiosClient.get(`/customers/${id}`),
  createCustomer: (data) => axiosClient.post('/customers', data),
  updateCustomer: (id, data) => axiosClient.put(`/customers/${id}`, data),
  addFollowUp: (id, data) => axiosClient.post(`/customers/${id}/follow-up`, data),
};

// Product Services
export const productService = {
  getProducts: (params) => axiosClient.get('/products', { params }),
  getProductById: (id) => axiosClient.get(`/products/${id}`),
  createProduct: (data) => axiosClient.post('/products', data),
  updateProduct: (id, data) => axiosClient.put(`/products/${id}`, data),
};

// Inventory Services
export const inventoryService = {
  getStockLogs: (params) => axiosClient.get('/inventory/logs', { params }),
  adjustStock: (data) => axiosClient.post('/inventory/adjust', data),
};

// Challan Services
export const challanService = {
  getChallans: (params) => axiosClient.get('/challans', { params }),
  getChallanById: (id) => axiosClient.get(`/challans/${id}`),
  createChallan: (data) => axiosClient.post('/challans', data),
  updateStatus: (id, status) => axiosClient.patch(`/challans/${id}/status`, { status }),
  getPDFUrl: (id) => `/api/challans/${id}/pdf`,
};

// Dashboard Services
export const dashboardService = {
  getStats: () => axiosClient.get('/dashboard/stats'),
};
