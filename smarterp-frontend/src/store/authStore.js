import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user }),
      setTokens: (token, refreshToken) => set({ 
        token, 
        refreshToken,
        isAuthenticated: true 
      }),
      setLoading: (isLoading) => set({ isLoading }),
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
        localStorage.removeItem('auth-storage');
      },

      getToken: () => get().token,
      getRefreshToken: () => get().refreshToken,
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);