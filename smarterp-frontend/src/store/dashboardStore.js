import { create } from 'zustand';

export const useDashboardStore = create((set, get) => ({
  dashboardData: {
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
    purchaseTrend: 0
  },
  isLoading: false,

  setDashboardData: (data) => set({ dashboardData: { ...get().dashboardData, ...data } }),
  setLoading: (isLoading) => set({ isLoading }),

  updateDashboardData: (updates) => {
    set((state) => ({
      dashboardData: { ...state.dashboardData, ...updates }
    }));
  },

  resetDashboard: () => set({
    dashboardData: {
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
      purchaseTrend: 0
    }
  })
}));