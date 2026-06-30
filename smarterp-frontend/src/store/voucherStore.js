import { create } from 'zustand';

export const useVoucherStore = create((set, get) => ({
  vouchers: [],
  currentVoucher: null,
  isLoading: false,
  stats: null,
  lastCreatedVoucher: null,

  setVouchers: (vouchers) => set({ vouchers }),
  setCurrentVoucher: (voucher) => set({ currentVoucher: voucher }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setLastCreatedVoucher: (voucher) => set({ lastCreatedVoucher: voucher }),

  addVoucher: (voucher) => {
    set((state) => ({
      vouchers: [voucher, ...state.vouchers],
      lastCreatedVoucher: voucher
    }));
  },

  clearLastCreatedVoucher: () => set({ lastCreatedVoucher: null }),

  updateStats: (newStats) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats }
    }));
  }
}));