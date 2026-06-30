import { create } from 'zustand';

export const useMainStore = create((set, get) => ({
  // Dashboard Data
  dashboard: {
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
    todayPurchaseOrders: 0
  },

  // Stock Data
  stock: {
    items: [],
    groups: [],
    units: [],
    lowStockItems: [],
    totalValue: 0
  },

  // Voucher Data
  vouchers: {
    list: [],
    stats: null,
    lastCreated: null
  },

  // Ledger Data
  ledgers: {
    list: [],
    groups: [],
    lastCreated: null
  },

  // Customer Data
  customers: {
    list: [],
    lastCreated: null
  },

  // Supplier Data
  suppliers: {
    list: [],
    lastCreated: null
  },

  // Loading states
  loading: {
    dashboard: false,
    stock: false,
    vouchers: false,
    ledgers: false,
    customers: false,
    suppliers: false
  },

  // Actions to update data
  updateDashboard: (data) => {
    set((state) => ({
      dashboard: { ...state.dashboard, ...data }
    }));
  },

  updateStock: (data) => {
    set((state) => ({
      stock: { ...state.stock, ...data }
    }));
  },

  updateStockItem: (id, updates) => {
    set((state) => ({
      stock: {
        ...state.stock,
        items: state.stock.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }
    }));
  },

  addStockItem: (item) => {
    set((state) => ({
      stock: {
        ...state.stock,
        items: [item, ...state.stock.items]
      }
    }));
  },

  addVoucher: (voucher) => {
    set((state) => ({
      vouchers: {
        ...state.vouchers,
        list: [voucher, ...state.vouchers.list],
        lastCreated: voucher
      }
    }));
  },

  addLedger: (ledger) => {
    set((state) => ({
      ledgers: {
        ...state.ledgers,
        list: [ledger, ...state.ledgers.list],
        lastCreated: ledger
      }
    }));
  },

  addCustomer: (customer) => {
    set((state) => ({
      customers: {
        ...state.customers,
        list: [customer, ...state.customers.list],
        lastCreated: customer
      }
    }));
  },

  addSupplier: (supplier) => {
    set((state) => ({
      suppliers: {
        ...state.suppliers,
        list: [supplier, ...state.suppliers.list],
        lastCreated: supplier
      }
    }));
  },

  setLoading: (key, value) => {
    set((state) => ({
      loading: { ...state.loading, [key]: value }
    }));
  },

  // Clear last created items
  clearLastCreated: () => {
    set((state) => ({
      vouchers: { ...state.vouchers, lastCreated: null },
      ledgers: { ...state.ledgers, lastCreated: null },
      customers: { ...state.customers, lastCreated: null },
      suppliers: { ...state.suppliers, lastCreated: null }
    }));
  }
}));