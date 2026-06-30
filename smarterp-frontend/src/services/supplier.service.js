import api from './api';

export const supplierService = {
  // Get all suppliers
    async getAll(companyId, filters = {}) {
        try {
            const params = new URLSearchParams({
                companyId,
                ...filters
            });
            const response = await api.get(`/suppliers?${params}`);
            return response.data; // Make sure this returns { data: [], count: 0 }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            return { data: [], count: 0 };
        }
    },

  // Get supplier by ID
  async getById(companyId, id) {
    const response = await api.get(`/suppliers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  // Create new supplier
  async create(companyId, data) {
    const response = await api.post(`/suppliers?companyId=${companyId}`, data);
    return response.data.data;
  },

  // Update supplier
  async update(companyId, id, data) {
    const response = await api.put(`/suppliers/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  // Delete supplier
  async delete(companyId, id) {
    const response = await api.delete(`/suppliers/${id}?companyId=${companyId}`);
    return response.data;
  },

  // Get purchase history
  async getPurchaseHistory(companyId, id) {
    const response = await api.get(`/suppliers/${id}/purchases?companyId=${companyId}`);
    return response.data.data;
  },

  // Get payment history
  async getPaymentHistory(companyId, id) {
    const response = await api.get(`/suppliers/${id}/payments?companyId=${companyId}`);
    return response.data.data;
  },

  // Search suppliers
  async search(companyId, query) {
    const response = await api.get(`/suppliers/search?companyId=${companyId}&q=${query}`);
    return response.data.data;
  }
};