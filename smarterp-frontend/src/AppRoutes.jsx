import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import CompanyPage from './pages/Company';
import DashboardPage from './pages/DashboardPage';
import LedgerPage from './pages/LedgerPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import StockPage from './pages/StockPage';
import VoucherPage from './pages/VoucherPage';
import BillingPage from './pages/BillingPage';
import CustomerPage from './pages/CustomerPage';
import SupplierPage from './pages/SupplierPage';

const ReportsPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
    <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
  </div>
);

const SettingsPage = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
    <p className="text-gray-600 dark:text-gray-400 mt-2">Coming soon...</p>
  </div>
);

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
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
            <Route path="/billing" element={<BillingPage />} />
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