import api from './api';

export const dashboardService = {
  async getOverview(companyId) {
    const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
    return response.data.data;
  },

  async getSalesData(companyId, period = 'monthly') {
    const response = await api.get(`/dashboard/sales?companyId=${companyId}&period=${period}`);
    return response.data.data;
  },

  async getRecentTransactions(companyId, limit = 10) {
    const response = await api.get(`/dashboard/transactions?companyId=${companyId}&limit=${limit}`);
    return response.data.data;
  },

  async getTopCustomers(companyId, limit = 5) {
    const response = await api.get(`/dashboard/top-customers?companyId=${companyId}&limit=${limit}`);
    return response.data.data;
  },

  async getLowStockAlerts(companyId) {
    const response = await api.get(`/dashboard/low-stock?companyId=${companyId}`);
    return response.data.data;
  },

  async getStats(companyId) {
    const response = await api.get(`/dashboard/stats?companyId=${companyId}`);
    return response.data.data;
  }
};