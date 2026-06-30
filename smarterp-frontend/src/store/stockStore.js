import { create } from 'zustand';

export const useStockStore = create((set, get) => ({
  stockGroups: [],
  units: [],
  stockItems: [],
  currentStockItem: null,
  isLoading: false,
  lowStockItems: [],
  stockValue: 0,
  lastUpdatedItem: null,

  setStockGroups: (groups) => set({ stockGroups: groups }),
  setUnits: (units) => set({ units }),
  setStockItems: (items) => set({ stockItems: items }),
  setCurrentStockItem: (item) => set({ currentStockItem: item }),
  setLowStockItems: (items) => set({ lowStockItems: items }),
  setStockValue: (value) => set({ stockValue: value }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastUpdatedItem: (item) => set({ lastUpdatedItem: item }),

  updateStockItem: (id, data) => {
    set((state) => ({
      stockItems: state.stockItems.map(item =>
        item.id === id ? { ...item, ...data } : item
      ),
      currentStockItem: state.currentStockItem?.id === id
        ? { ...state.currentStockItem, ...data }
        : state.currentStockItem,
      lastUpdatedItem: { id, ...data }
    }));
  },

  clearLastUpdatedItem: () => set({ lastUpdatedItem: null })
}));