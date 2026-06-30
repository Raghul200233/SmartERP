import { create } from 'zustand';

export const useSupplierStore = create((set, get) => ({
  suppliers: [],
  currentSupplier: null,
  isLoading: false,
  purchaseHistory: [],
  paymentHistory: [],

  setSuppliers: (suppliers) => set({ suppliers: Array.isArray(suppliers) ? suppliers : [] }),
  setCurrentSupplier: (supplier) => set({ currentSupplier: supplier }),
  setPurchaseHistory: (history) => set({ purchaseHistory: history }),
  setPaymentHistory: (history) => set({ paymentHistory: history }),
  setLoading: (isLoading) => set({ isLoading }),

  addSupplier: (supplier) => {
    set((state) => ({
      suppliers: [...state.suppliers, supplier]
    }));
  },

  updateSupplier: (id, data) => {
    set((state) => ({
      suppliers: state.suppliers.map(s => 
        s.id === id ? { ...s, ...data } : s
      ),
      currentSupplier: state.currentSupplier?.id === id 
        ? { ...state.currentSupplier, ...data } 
        : state.currentSupplier
    }));
  },

  removeSupplier: (id) => {
    set((state) => ({
      suppliers: state.suppliers.filter(s => s.id !== id),
      currentSupplier: state.currentSupplier?.id === id ? null : state.currentSupplier
    }));
  },

  clearSupplierData: () => set({
    suppliers: [],
    currentSupplier: null,
    purchaseHistory: [],
    paymentHistory: []
  })
}));