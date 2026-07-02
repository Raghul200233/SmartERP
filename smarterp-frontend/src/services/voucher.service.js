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
    async downloadPDF(companyId, id) {
    try {
      const response = await api.get(`/vouchers/${id}/pdf?companyId=${companyId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },

  async create(companyId, data) {
    const response = await api.post(`/vouchers?companyId=${companyId}`, data);
    return response.data.data;
  },

  async getTypes(companyId) {
    const response = await api.get(`/vouchers/types?companyId=${companyId}`);
    return response.data.data;
  },

  async getPaymentStats(companyId, startDate, endDate) {
    const params = new URLSearchParams({ 
        companyId, 
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
    });
    const response = await api.get(`/vouchers/payment-stats?${params}`);
    return response.data.data;
},

  async getStats(companyId, startDate, endDate) {
    const params = new URLSearchParams({ companyId, startDate, endDate });
    const response = await api.get(`/vouchers/stats?${params}`);
    return response.data.data;
  },
  
  async markAsPaid(companyId, id, paymentMethod, amount) {
    const response = await api.patch(`/vouchers/${id}/pay?companyId=${companyId}`, {
        paymentMethod,
        amount
    });
    return response.data.data;
},

async getLedgerStatement(companyId, ledgerId) {
    const response = await api.get(`/vouchers/${ledgerId}/statement?companyId=${companyId}`);
    return response.data.data;
}
};