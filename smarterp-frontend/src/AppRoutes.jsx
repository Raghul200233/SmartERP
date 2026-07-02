import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import CompanyPage from './pages/Company';
import DashboardPage from './pages/DashboardPage';
import LedgerPage from './pages/LedgerPage';
import StockPage from './pages/StockPage';
import VoucherPage from './pages/VoucherPage';
import CustomerPage from './pages/CustomerPage';
import SupplierPage from './pages/SupplierPage';
import ReportsPage from './pages/ReportsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import SettingsPage from './pages/SettingsPage';

// ✅ Inner component to use hooks inside Router
const KeyboardShortcutsInitializer = () => {
  useKeyboardShortcuts();
  return null;
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      {/* ✅ Keyboard shortcuts initialized inside Router */}
      <KeyboardShortcutsInitializer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/companies" element={<CompanyPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ledgers" element={<LedgerPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/vouchers" element={<VoucherPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};