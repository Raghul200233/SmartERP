import api from './api';

export const voucherService = {
  async getAll(companyId, filters = {}) {
    try {
      const params = new URLSearchParams({
        companyId,
        ...filters
      });
      const response = await api.get(`/vouchers?${params}`);
      console.log('Voucher API response:', response.data); // Debug log
      return response.data; // Should return { data: [], count: 0 }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return { data: [], count: 0 };
    }
  },

  async getById(companyId, id) {
    const response = await api.get(`/vouchers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/vouchers?companyId=${companyId}`, data);
    return response.data.data;
  },

  async getTypes(companyId) {
    const response = await api.get(`/vouchers/types?companyId=${companyId}`);
    return response.data.data;
  },

  async getStats(companyId, startDate, endDate) {
    const params = new URLSearchParams({ companyId, startDate, endDate });
    const response = await api.get(`/vouchers/stats?${params}`);
    return response.data.data;
  }
};