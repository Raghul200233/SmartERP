import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCompanyStore } from '../../store/companyStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { currentCompany } = useCompanyStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentCompany) {
    return <Navigate to="/companies" replace />;
  }

  return <Outlet />;
};