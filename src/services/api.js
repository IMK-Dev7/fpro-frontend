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
  // =============== FACTURES ===============
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
  
  getByStatut: (statut, page = 0, size = 10, sortBy = 'dateFacturation', direction = 'desc') =>
    api.get(`/factures/by-statut?statut=${statut}&page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`),
  
  getAvecResteAPayer: () => api.get('/factures/reste-a-payer'),
  
  getAvecResteAPayerPaginated: (page = 0, size = 10, sortBy = 'resteAPayer', direction = 'desc') =>
    api.get(`/factures/paginated/reste-a-payer?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`),
  
  getStatsPaiements: () => api.get('/factures/stats-paiements'),
  
  getPaiements: (factureId) => api.get(`/factures/${factureId}/paiements`),
  
  addPaiement: (factureId, data) => api.post(`/factures/${factureId}/paiements`, data),
  
  deletePaiement: (factureId, paiementId) => api.delete(`/factures/${factureId}/paiements/${paiementId}`),
  
  getTotalPaiements: (factureId) => api.get(`/factures/${factureId}/paiements/total`),
};

export default api;