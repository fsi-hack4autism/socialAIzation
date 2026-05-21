import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookies/auth
});

// Request interceptor for adding auth tokens
api.interceptors.request.use((reqConfig: AxiosRequestConfig) => {
  const token = localStorage.getItem(config.auth.tokenStorageKey);
  if (token && reqConfig.headers) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Handle unauthorized (could redirect to login)
      console.error('Authentication required');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Users
  getCurrentUser: () => api.get('/api/users/me'),
  updateUserProfile: (data: any) => api.put('/api/users/profile', data),
  
  // Scenarios
  getScenarios: () => api.get('/api/scenarios'),
  getScenarioById: (id: string) => api.get(`/api/scenarios/${id}`),
  createScenario: (data: any) => api.post('/api/scenarios', data),
  
  // Sessions
  getSessions: () => api.get('/api/sessions'),
  getSessionById: (id: string) => api.get(`/api/sessions/${id}`),
  createSession: (data: any) => api.post('/api/sessions', data),
  
  // Other methods as needed...
};

export default apiClient;
