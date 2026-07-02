import api from './api';

export const ledgerService = {
  // Ledger operations
  async getAll(companyId, filters = {}) {
    const params = new URLSearchParams({
      companyId,
      ...filters
    });
    const response = await api.get(`/ledgers?${params}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/ledgers/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/ledgers?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/ledgers/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

async delete(companyId, id) {
    try {
        const response = await api.delete(`/ledgers/${id}?companyId=${companyId}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 409) {
            throw new Error('Cannot delete ledger with transactions. It has been deactivated instead.');
        }
        throw error;
    }
},

  async getStatement(companyId, id, startDate, endDate) {
    const params = new URLSearchParams({
      companyId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });
    const response = await api.get(`/ledgers/statement/${id}?${params}`);
    return response.data.data;
  },

  async search(companyId, query) {
    const response = await api.get(`/ledgers/search?companyId=${companyId}&q=${query}`);
    return response.data.data;
  },

  async getByType(companyId, type) {
    const response = await api.get(`/ledgers/type/${type}?companyId=${companyId}`);
    return response.data.data;
  }
};

export const accountGroupService = {
  async getAll(companyId) {
    const response = await api.get(`/account-groups?companyId=${companyId}`);
    return response.data.data;
  },

  async getById(companyId, id) {
    const response = await api.get(`/account-groups/${id}?companyId=${companyId}`);
    return response.data.data;
  },

  async create(companyId, data) {
    const response = await api.post(`/account-groups?companyId=${companyId}`, data);
    return response.data.data;
  },

  async update(companyId, id, data) {
    const response = await api.put(`/account-groups/${id}?companyId=${companyId}`, data);
    return response.data.data;
  },

  async delete(companyId, id) {
    const response = await api.delete(`/account-groups/${id}?companyId=${companyId}`);
    return response.data;
  },

  async getTypes() {
    const response = await api.get('/account-groups/types');
    return response.data.data;
  },

  async getDefaultGroups(companyId) {
    const response = await api.get(`/account-groups/default?companyId=${companyId}`);
    return response.data.data;
  }
};