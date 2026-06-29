import { create } from 'zustand';

export const useStockStore = create((set, get) => ({
  stockGroups: [],
  units: [],
  stockItems: [],
  currentStockItem: null,
  isLoading: false,
  lowStockItems: [],
  stockValue: 0,

  setStockGroups: (groups) => set({ stockGroups: groups }),
  setUnits: (units) => set({ units }),
  setStockItems: (items) => set({ stockItems: items }),
  setCurrentStockItem: (item) => set({ currentStockItem: item }),
  setLowStockItems: (items) => set({ lowStockItems: items }),
  setStockValue: (value) => set({ stockValue: value }),
  setLoading: (isLoading) => set({ isLoading }),

  addStockGroup: (group) => {
    set((state) => ({
      stockGroups: [...state.stockGroups, group]
    }));
  },

  updateStockGroup: (id, data) => {
    set((state) => ({
      stockGroups: state.stockGroups.map(g => 
        g.id === id ? { ...g, ...data } : g
      )
    }));
  },

  removeStockGroup: (id) => {
    set((state) => ({
      stockGroups: state.stockGroups.filter(g => g.id !== id)
    }));
  },

  addUnit: (unit) => {
    set((state) => ({
      units: [...state.units, unit]
    }));
  },

  updateUnit: (id, data) => {
    set((state) => ({
      units: state.units.map(u => 
        u.id === id ? { ...u, ...data } : u
      )
    }));
  },

  removeUnit: (id) => {
    set((state) => ({
      units: state.units.filter(u => u.id !== id)
    }));
  },

  addStockItem: (item) => {
    set((state) => ({
      stockItems: [...state.stockItems, item]
    }));
  },

  updateStockItem: (id, data) => {
    set((state) => ({
      stockItems: state.stockItems.map(i => 
        i.id === id ? { ...i, ...data } : i
      ),
      currentStockItem: state.currentStockItem?.id === id 
        ? { ...state.currentStockItem, ...data } 
        : state.currentStockItem
    }));
  },

  removeStockItem: (id) => {
    set((state) => ({
      stockItems: state.stockItems.filter(i => i.id !== id),
      currentStockItem: state.currentStockItem?.id === id ? null : state.currentStockItem
    }));
  },

  clearStockData: () => set({
    stockGroups: [],
    units: [],
    stockItems: [],
    currentStockItem: null,
    lowStockItems: [],
    stockValue: 0
  })
}));