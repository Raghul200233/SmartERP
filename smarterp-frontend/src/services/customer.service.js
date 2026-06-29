import api from './api';

export const customerService = {
   async getAll(companyId, filters = {}) {
    try {
      const params = new URLSearchParams({
        companyId,
        ...filters
      });
      const response = await api.get(`/customers?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error.message || 'Failed to fetch customers'
      };
    }
  },

  async getById(companyId, id) {
    const response = await api.get(`/customers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/customers?companyId=${companyId}`, {
      name: data.name,
      mobile: data.mobile || null
    });
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/customers/${id}?companyId=${companyId}`, {
      name: data.name,
      mobile: data.mobile || null
    });
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/customers/${id}?companyId=${companyId}`);
    return response.data;
  },

  async search(companyId, query) {
    const response = await api.get(`/customers/search?companyId=${companyId}&q=${query}`);
    return response.data.data;
  }
};