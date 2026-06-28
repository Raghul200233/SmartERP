import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { useUIStore } from '../store/uiStore';
import { dashboardService } from '../services/dashboard.service';
import { StatsCards } from '../components/dashboard/StatsCards';
import { SalesChart } from '../components/dashboard/SalesChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TopCustomers } from '../components/dashboard/TopCustomers';
import { LowStockAlert } from '../components/dashboard/LowStockAlert';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useUIStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoadingState] = useState(true);

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
    }
  }, [currentCompany]);

  const fetchDashboardData = async () => {
    try {
      setLoadingState(true);
      setLoading(true);

      const companyId = currentCompany.id;

      // Fetch all dashboard data in parallel
      const [
        statsData,
        salesData,
        transactionsData,
        customersData,
        lowStockData
      ] = await Promise.all([
        dashboardService.getStats(companyId),
        dashboardService.getSalesData(companyId, 'monthly'),
        dashboardService.getRecentTransactions(companyId, 10),
        dashboardService.getTopCustomers(companyId, 5),
        dashboardService.getLowStockAlerts(companyId)
      ]);

      setStats(statsData);
      setSalesData(salesData);
      setTransactions(transactionsData);
      setTopCustomers(customersData);
      setLowStockItems(lowStockData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            No Company Selected
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a company to view the dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with {currentCompany.name}
          </p>
        </div>
        <div className="mt-2 md:mt-0 flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleString()}
          </span>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} type="line" />
        </div>
        <div>
          <LowStockAlert items={lowStockItems} />
        </div>
      </div>

      {/* Transactions and Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactions} />
        <TopCustomers customers={topCustomers} />
      </div>
    </div>
  );
};

export default DashboardPage;