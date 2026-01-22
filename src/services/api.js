import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const factureService = {
  getAll: (page = 0, size = 10, sortBy = 'dateFacturation', direction = 'desc') =>
    api.get(`/factures/paginated?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`),
  
  search: (searchTerm, page = 0, size = 10) =>
    api.get(`/factures/search?search=${encodeURIComponent(searchTerm)}&page=${page}&size=${size}`),
  
  getById: (id) => api.get(`/factures/${id}`),
  
  create: (data) => api.post('/factures', data),
  
  update: (id, data) => api.put(`/factures/${id}`, data),
  
  delete: (id) => api.delete(`/factures/${id}`),
  
  deleteMultiple: (ids) => api.delete('/factures/batch', { data: ids }),
  
  preview: (id) => api.get(`/factures/${id}/preview`),
  
  downloadPdf: (id) => api.get(`/factures/${id}/pdf`, { responseType: 'blob' }),
  
  viewPdf: (id) => api.get(`/factures/${id}/view`, { responseType: 'blob' }),
};

export default api;