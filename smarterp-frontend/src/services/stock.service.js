import api from './api';

export const stockGroupService = {
  async getAll(companyId) {
    const response = await api.get(`/stock-groups?companyId=${companyId}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/stock-groups/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/stock-groups?companyId=${companyId}`, {
      name: data.name.trim(),
      parent_id: data.parent_id || null
    });
    return response.data.data;
  },

  async update(companyId, id, data) {
    console.log('Update service called:', { companyId, id, data });
    const response = await api.put(`/stock-groups/${id}?companyId=${companyId}`, {
      name: data.name.trim(),
      parent_id: data.parent_id || null
    });
    console.log('Update response:', response);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/stock-groups/${id}?companyId=${companyId}`);
    return response.data;
  }
};

export const unitService = {
  async getAll(companyId) {
    const response = await api.get(`/units?companyId=${companyId}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/units/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/units?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/units/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/units/${id}?companyId=${companyId}`);
    return response.data;
  }
};

export const stockItemService = {
  async getAll(companyId, filters = {}) {
    const params = new URLSearchParams({
      companyId,
      ...filters
    });
    const response = await api.get(`/stock-items?${params}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/stock-items/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/stock-items?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/stock-items/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/stock-items/${id}?companyId=${companyId}`);
    return response.data;
  },

  async getLowStock(companyId) {
    const response = await api.get(`/stock-items/low-stock?companyId=${companyId}`);
    return response.data.data;
  },

  async getStockValue(companyId) {
    const response = await api.get(`/stock-items/stock-value?companyId=${companyId}`);
    return response.data.data;
  },

  async search(companyId, query) {
    const response = await api.get(`/stock-items/search?companyId=${companyId}&q=${query}`);
    return response.data.data;
  }
};