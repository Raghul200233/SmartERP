import { create } from 'zustand';

export const useCustomerStore = create((set, get) => ({
  customers: [],
  currentCustomer: null,
  isLoading: false,
  ledger: null,
  statement: null,

  setCustomers: (customers) => set({ customers }),
  setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
  setLedger: (ledger) => set({ ledger }),
  setStatement: (statement) => set({ statement }),
  setLoading: (isLoading) => set({ isLoading }),

  addCustomer: (customer) => {
    set((state) => ({
      customers: [...state.customers, customer]
    }));
  },

  updateCustomer: (id, data) => {
    set((state) => ({
      customers: state.customers.map(c => 
        c.id === id ? { ...c, ...data } : c
      ),
      currentCustomer: state.currentCustomer?.id === id 
        ? { ...state.currentCustomer, ...data } 
        : state.currentCustomer
    }));
  },

  removeCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter(c => c.id !== id),
      currentCustomer: state.currentCustomer?.id === id ? null : state.currentCustomer
    }));
  },

  clearCustomerData: () => set({
    customers: [],
    currentCustomer: null,
    ledger: null,
    statement: null
  })
}));