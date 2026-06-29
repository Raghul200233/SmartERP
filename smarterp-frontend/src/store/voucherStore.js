import { create } from 'zustand';

export const useVoucherStore = create((set, get) => ({
  vouchers: [],
  currentVoucher: null,
  voucherTypes: [],
  isLoading: false,
  stats: null,

  setVouchers: (vouchers) => set({ vouchers }),
  setCurrentVoucher: (voucher) => set({ currentVoucher: voucher }),
  setVoucherTypes: (types) => set({ voucherTypes: types }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),

  addVoucher: (voucher) => {
    set((state) => ({
      vouchers: [voucher, ...state.vouchers]
    }));
  },

  updateVoucher: (id, data) => {
    set((state) => ({
      vouchers: state.vouchers.map(v => 
        v.id === id ? { ...v, ...data } : v
      ),
      currentVoucher: state.currentVoucher?.id === id 
        ? { ...state.currentVoucher, ...data } 
        : state.currentVoucher
    }));
  },

  removeVoucher: (id) => {
    set((state) => ({
      vouchers: state.vouchers.filter(v => v.id !== id),
      currentVoucher: state.currentVoucher?.id === id ? null : state.currentVoucher
    }));
  },

  clearVouchers: () => set({
    vouchers: [],
    currentVoucher: null,
    stats: null
  })
}));