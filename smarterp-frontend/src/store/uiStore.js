import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isDarkMode: false,
  sidebarOpen: true,
  notifications: [],
  isLoading: false,

  toggleDarkMode: () => set((state) => ({ 
    isDarkMode: !state.isDarkMode 
  })),
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  addNotification: (notification) => {
    const id = Date.now();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    // Auto remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, 5000);
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearNotifications: () => set({ notifications: [] })
}));