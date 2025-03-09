import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Ensure credentials are sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token if it exists
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
