import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { shortcutManager } from '../utils/keyboardShortcuts';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  useEffect(() => {
    // Global Shortcuts
    shortcutManager.register('F1', () => navigate('/companies'), 'global');
    shortcutManager.register('F3', () => {
      toast.info('Company Info - Coming Soon');
    }, 'global');
    shortcutManager.register('F4', () => {
      window.open('calc', '_blank', 'width=300,height=400');
    }, 'global');
    shortcutManager.register('F5', () => window.location.reload(), 'global');
    shortcutManager.register('Escape', () => {
      window.history.back();
    }, 'global');
    shortcutManager.register('Ctrl+Q', () => {
      logout();
      navigate('/login');
    }, 'global');
    shortcutManager.register('Ctrl+H', () => navigate('/dashboard'), 'global');
    shortcutManager.register('Ctrl+K', () => {
      const el = document.getElementById('command-palette');
      if (el) el.focus();
    }, 'global');

    // Masters Shortcuts
    shortcutManager.register('Alt+L', () => navigate('/ledgers'), 'masters');
    shortcutManager.register('Alt+G', () => navigate('/ledgers'), 'masters');
    shortcutManager.register('Alt+S', () => navigate('/stock'), 'masters');
    shortcutManager.register('Alt+U', () => navigate('/stock'), 'masters');

    // Voucher Shortcuts
    shortcutManager.register('F8', () => navigate('/vouchers'), 'voucher');
    shortcutManager.register('F9', () => navigate('/vouchers'), 'voucher');

    // ✅ Navigation Shortcuts
    shortcutManager.register('ArrowUp', () => {
      // Navigate up in lists
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('table')) {
        const row = activeElement.closest('tr');
        if (row && row.previousElementSibling) {
          const firstClickable = row.previousElementSibling.querySelector('button, a, [role="button"]');
          if (firstClickable) firstClickable.click();
        }
      }
    }, 'navigation');

    shortcutManager.register('ArrowDown', () => {
      // Navigate down in lists
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('table')) {
        const row = activeElement.closest('tr');
        if (row && row.nextElementSibling) {
          const firstClickable = row.nextElementSibling.querySelector('button, a, [role="button"]');
          if (firstClickable) firstClickable.click();
        }
      }
    }, 'navigation');

    shortcutManager.register('ArrowLeft', () => {
      window.history.back();
    }, 'navigation');

    shortcutManager.register('ArrowRight', () => {
      window.history.forward();
    }, 'navigation');

    shortcutManager.register('Enter', () => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement.closest('table')) {
        const row = activeElement.closest('tr');
        if (row) {
          const button = row.querySelector('button:not([hidden])');
          if (button) button.click();
        }
      }
    }, 'navigation');

    // Search Shortcuts
    shortcutManager.register('Ctrl+F', () => {
      const el = document.getElementById('global-search');
      if (el) el.focus();
    }, 'search');

    // Set context based on route
    const setContextFromRoute = () => {
      const path = location.pathname;
      if (path.includes('/vouchers')) {
        shortcutManager.setContext('voucher');
      } else if (path.includes('/ledgers') || path.includes('/stock')) {
        shortcutManager.setContext('masters');
      } else {
        shortcutManager.setContext('global');
      }
    };

    setContextFromRoute();

    const handleKeyDown = (event) => {
      shortcutManager.handleKeyDown(event);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, location.pathname, logout]);
};