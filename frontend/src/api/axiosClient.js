import axios from 'axios';

// In production, VITE_API_BASE_URL points to the deployed backend (e.g. https://mini-erp-backend.onrender.com/api)
// In local development, it defaults to '/api' (proxied by Vite)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token securely
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_portal_token') || localStorage.getItem('mini_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling & session expiry
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear sensitive session state on 401 Unauthorized
      localStorage.removeItem('crm_portal_token');
      localStorage.removeItem('crm_portal_user');
      localStorage.removeItem('mini_erp_token');
      localStorage.removeItem('mini_erp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
