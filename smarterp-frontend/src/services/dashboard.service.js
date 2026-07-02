import api from './api';

export const dashboardService = {
  async getOverview(companyId) {
    try {
      // Use the overview endpoint which we know exists
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      // Return default data structure
      return {
        todaySales: 0,
        todayPurchases: 0,
        totalCustomers: 0,
        totalLedgers: 0,
        stockValue: 0,
        lowStockItems: [],
        recentTransactions: [],
        topCustomers: [],
        salesData: [],
        todayOrders: 0,
        todayPurchaseOrders: 0,
        receivables: 0,
        payables: 0,
        salesTrend: 0,
        purchaseTrend: 0,
        customersTrend: 0,
        stockTrend: 0,
        receivablesTrend: 0,
        payablesTrend: 0
      };
    }
  },

  async getStats(companyId) {
    try {
      // Use the overview endpoint for stats too
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      const data = response.data.data;
      return {
        todaySales: data.todaySales || 0,
        todayPurchases: data.todayPurchases || 0,
        totalCustomers: data.totalCustomers || 0,
        stockValue: data.stockValue || 0,
        receivables: data.receivables || 0,
        payables: data.payables || 0,
        salesTrend: data.salesTrend || 0,
        purchaseTrend: data.purchaseTrend || 0,
        customersTrend: data.customersTrend || 0,
        stockTrend: data.stockTrend || 0,
        receivablesTrend: data.receivablesTrend || 0,
        payablesTrend: data.payablesTrend || 0,
        todayOrders: data.todayOrders || 0,
        todayPurchaseOrders: data.todayPurchaseOrders || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        todaySales: 0,
        todayPurchases: 0,
        totalCustomers: 0,
        stockValue: 0,
        receivables: 0,
        payables: 0,
        salesTrend: 0,
        purchaseTrend: 0,
        customersTrend: 0,
        stockTrend: 0,
        receivablesTrend: 0,
        payablesTrend: 0,
        todayOrders: 0,
        todayPurchaseOrders: 0
      };
    }
  },

  async getSalesData(companyId, period = 'monthly') {
    try {
      // Try to get sales data from overview
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      const data = response.data.data;
      // Return sales data if available, otherwise empty array
      return data.salesData || [];
    } catch (error) {
      console.error('Error fetching sales data:', error);
      // Return mock data for testing
      return this.getMockSalesData();
    }
  },

  // Mock data for testing when API is not available
  getMockSalesData() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      name: month,
      sales: Math.floor(Math.random() * 50000) + 10000,
      purchases: Math.floor(Math.random() * 30000) + 5000
    }));
  },

  async getTodaySales(companyId) {
    const response = await api.get(`/dashboard/today-sales?companyId=${companyId}`);
    return response.data.data;
},

  async getRecentTransactions(companyId, limit = 10) {
    try {
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      const data = response.data.data;
      return data.recentTransactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  async getTopCustomers(companyId, limit = 5) {
    try {
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      const data = response.data.data;
      return data.topCustomers || [];
    } catch (error) {
      console.error('Error fetching top customers:', error);
      return [];
    }
  },

  async getLowStockAlerts(companyId) {
    try {
      const response = await api.get(`/dashboard/overview?companyId=${companyId}`);
      const data = response.data.data;
      return data.lowStockItems || [];
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
      return [];
    }
  }
};