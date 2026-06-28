import { create } from 'zustand';

export const useLedgerStore = create((set, get) => ({
  ledgers: [],
  currentLedger: null,
  accountGroups: [],
  isLoading: false,
  statement: null,

  setLedgers: (ledgers) => set({ ledgers }),
  setCurrentLedger: (ledger) => set({ currentLedger: ledger }),
  setAccountGroups: (groups) => set({ accountGroups: groups }),
  setStatement: (statement) => set({ statement }),
  setLoading: (isLoading) => set({ isLoading }),

  addLedger: (ledger) => {
    set((state) => ({
      ledgers: [...state.ledgers, ledger]
    }));
  },

  updateLedger: (id, data) => {
    set((state) => ({
      ledgers: state.ledgers.map(l => 
        l.id === id ? { ...l, ...data } : l
      ),
      currentLedger: state.currentLedger?.id === id 
        ? { ...state.currentLedger, ...data } 
        : state.currentLedger
    }));
  },

  removeLedger: (id) => {
    set((state) => ({
      ledgers: state.ledgers.filter(l => l.id !== id),
      currentLedger: state.currentLedger?.id === id ? null : state.currentLedger
    }));
  },

  addAccountGroup: (group) => {
    set((state) => ({
      accountGroups: [...state.accountGroups, group]
    }));
  },

  updateAccountGroup: (id, data) => {
    set((state) => ({
      accountGroups: state.accountGroups.map(g => 
        g.id === id ? { ...g, ...data } : g
      )
    }));
  },

  removeAccountGroup: (id) => {
    set((state) => ({
      accountGroups: state.accountGroups.filter(g => g.id !== id)
    }));
  },

  clearStatement: () => set({ statement: null })
}));