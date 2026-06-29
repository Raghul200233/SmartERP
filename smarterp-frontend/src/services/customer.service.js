import api from './api';

export const customerService = {
  // Get all customers
  async getAll(companyId, filters = {}) {
    const params = new URLSearchParams({
      companyId,
      ...filters
    });
    const response = await api.get(`/customers?${params}`);
    return response.data.data;
  },

  // Get customer by ID
  async getById(companyId, id) {
    const response = await api.get(`/customers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  // Create new customer
  async create(companyId, data) {
    const response = await api.post(`/customers?companyId=${companyId}`, data);
    return response.data.data;
  },

  // Update customer
  async update(companyId, id, data) {
    const response = await api.put(`/customers/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  // Delete customer
  async delete(companyId, id) {
    const response = await api.delete(`/customers/${id}?companyId=${companyId}`);
    return response.data;
  },

  // Get customer ledger
  async getLedger(companyId, id, startDate, endDate) {
    const params = new URLSearchParams({
      companyId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const response = await api.get(`/customers/${id}/ledger?${params}`);
    return response.data.data;
  },

  // Get customer statement
  async getStatement(companyId, id) {
    const response = await api.get(`/customers/${id}/statement?companyId=${companyId}`);
    return response.data.data;
  },

  // Search customers
  async search(companyId, query) {
    const response = await api.get(`/customers/search?companyId=${companyId}&q=${query}`);
    return response.data.data;
  }
};