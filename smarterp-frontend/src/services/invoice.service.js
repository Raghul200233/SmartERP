import api from './api';

export const invoiceService = {
  async getAll(companyId, filters = {}) {
    const params = new URLSearchParams({
      companyId,
      ...filters
    });
    const response = await api.get(`/invoices?${params}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/invoices/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/invoices?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/invoices/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/invoices/${id}?companyId=${companyId}`);
    return response.data;
  },

  async updateStatus(companyId, id, status) {
    const response = await api.patch(`/invoices/${id}/status?companyId=${companyId}`, { status });
    return response.data.data;
  },

  async downloadPDF(companyId, id) {
    const response = await api.get(`/invoices/${id}/pdf?companyId=${companyId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getStats(companyId, startDate, endDate) {
    const params = new URLSearchParams({
      companyId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const response = await api.get(`/invoices/stats?${params}`);
    return response.data.data;
  }
};