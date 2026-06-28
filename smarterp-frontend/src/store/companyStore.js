import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCompanyStore = create(
  persist(
    (set, get) => ({
      companies: [],
      currentCompany: null,
      isLoading: false,

      setCompanies: (companies) => set({ companies }),
      setCurrentCompany: (company) => set({ currentCompany: company }),
      setLoading: (isLoading) => set({ isLoading }),
      
      addCompany: (company) => {
        set((state) => ({
          companies: [...state.companies, company]
        }));
      },
      
      updateCompany: (id, data) => {
        set((state) => ({
          companies: state.companies.map(c => 
            c.id === id ? { ...c, ...data } : c
          ),
          currentCompany: state.currentCompany?.id === id 
            ? { ...state.currentCompany, ...data } 
            : state.currentCompany
        }));
      },
      
      removeCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter(c => c.id !== id),
          currentCompany: state.currentCompany?.id === id 
            ? null 
            : state.currentCompany
        }));
      },
      
      getDefaultCompany: () => {
        const { companies } = get();
        return companies.find(c => c.is_default) || companies[0] || null;
      }
    }),
    {
      name: 'company-storage'
    }
  )
);