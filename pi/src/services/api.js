import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from Cookies first, then localStorage as fallback
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Categories API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Modules API
export const moduleAPI = {
  getAll: () => api.get('/modules'),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.patch(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
  getStatistics: (id) => api.get(`/modules/statistics/${id}`),
  getSuggestions: () => api.get('/modules/suggestions')
};

// Courses API
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getByModule: (moduleId) => api.get(`/courses/module/${moduleId}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  archive: (id) => api.patch(`/courses/${id}/archive`),
  purchase: (id) => api.post(`/courses/${id}/purchase`)
};

export default api;
