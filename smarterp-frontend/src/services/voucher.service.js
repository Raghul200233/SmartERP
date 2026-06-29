import api from './api';

export const voucherService = {
  async getAll(companyId, filters = {}) {
    const params = new URLSearchParams({
      companyId,
      ...filters
    });
    const response = await api.get(`/vouchers?${params}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/vouchers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/vouchers?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/vouchers/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/vouchers/${id}?companyId=${companyId}`);
    return response.data;
  },

  async getTypes(companyId) {
    const response = await api.get(`/vouchers/types?companyId=${companyId}`);
    return response.data.data;
  },

  async getStats(companyId, startDate, endDate) {
    const params = new URLSearchParams({
      companyId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const response = await api.get(`/vouchers/stats?${params}`);
    return response.data.data;
  }
};