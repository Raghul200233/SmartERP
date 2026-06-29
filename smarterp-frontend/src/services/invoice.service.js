import api from './api';

export const invoiceService = {
    async getAll(companyId, filters = {}) {
        try {
            const params = new URLSearchParams({
                companyId,
                ...filters
            });
            const response = await api.get(`/invoices?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching invoices:', error);
            // Return empty data structure
            return {
                success: false,
                data: [],
                count: 0,
                message: error.response?.data?.message || 'Failed to fetch invoices'
            };
        }
    },

    async getById(companyId, id) {
        try {
            const response = await api.get(`/invoices/${id}?companyId=${companyId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    },

    async create(companyId, data) {
        try {
            const response = await api.post(`/invoices?companyId=${companyId}`, data);
            return response.data.data;
        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        }
    },

    async update(companyId, id, data) {
        try {
            const response = await api.put(`/invoices/${id}?companyId=${companyId}`, data);
            return response.data.data;
        } catch (error) {
            console.error('Error updating invoice:', error);
            throw error;
        }
    },

    async delete(companyId, id) {
        try {
            const response = await api.delete(`/invoices/${id}?companyId=${companyId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting invoice:', error);
            throw error;
        }
    },

    async updateStatus(companyId, id, status) {
        try {
            const response = await api.patch(`/invoices/${id}/status?companyId=${companyId}`, { status });
            return response.data.data;
        } catch (error) {
            console.error('Error updating invoice status:', error);
            throw error;
        }
    },

    async downloadPDF(companyId, id) {
        try {
            const response = await api.get(`/invoices/${id}/pdf?companyId=${companyId}`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw error;
        }
    },

    async getStats(companyId, startDate, endDate) {
        try {
            const params = new URLSearchParams({
                companyId,
                ...(startDate && { startDate }),
                ...(endDate && { endDate })
            });
            const response = await api.get(`/invoices/stats?${params}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching invoice stats:', error);
            throw error;
        }
    }
};