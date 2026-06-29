import api from './api';

export const reportService = {
    // Financial Reports
    async getBalanceSheet(companyId, asOnDate) {
        const params = new URLSearchParams({
            companyId,
            ...(asOnDate && { asOnDate })
        });
        const response = await api.get(`/reports/balance-sheet?${params}`);
        return response.data.data;
    },

    async getProfitLoss(companyId, startDate, endDate) {
        const params = new URLSearchParams({
            companyId,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        });
        const response = await api.get(`/reports/profit-loss?${params}`);
        return response.data.data;
    },

    async getTrialBalance(companyId, asOnDate) {
        const params = new URLSearchParams({
            companyId,
            ...(asOnDate && { asOnDate })
        });
        const response = await api.get(`/reports/trial-balance?${params}`);
        return response.data.data;
    },

    // Inventory Reports
    async getStockSummary(companyId) {
        const response = await api.get(`/reports/stock-summary?companyId=${companyId}`);
        return response.data.data;
    },

    // GST Reports
    async getGSTReport(companyId, startDate, endDate) {
        const params = new URLSearchParams({
            companyId,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        });
        const response = await api.get(`/reports/gst?${params}`);
        return response.data.data;
    },

    // Sales & Purchase Reports
    async getSalesReport(companyId, startDate, endDate) {
        const params = new URLSearchParams({
            companyId,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        });
        const response = await api.get(`/reports/sales?${params}`);
        return response.data.data;
    },

    async getPurchaseReport(companyId, startDate, endDate) {
        const params = new URLSearchParams({
            companyId,
            ...(startDate && { startDate }),
            ...(endDate && { endDate })
        });
        const response = await api.get(`/reports/purchases?${params}`);
        return response.data.data;
    }
};