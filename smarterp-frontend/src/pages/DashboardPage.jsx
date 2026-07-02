import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { useDashboardStore } from '../store/dashboardStore';
import { dashboardService } from '../services/dashboard.service';
import { voucherService } from '../services/voucher.service';
import { StatsCards } from '../components/dashboard/StatsCards';
import { SalesChart } from '../components/dashboard/SalesChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TopCustomers } from '../components/dashboard/TopCustomers';
import { LowStockAlert } from '../components/dashboard/LowStockAlert';
import { TrendingUp, CreditCard, Wallet, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { currentCompany } = useCompanyStore();
  const { dashboardData, setDashboardData, isLoading, setLoading } = useDashboardStore();
  const [salesData, setSalesData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoadingState] = useState(true);
  const [error, setError] = useState(null);
  const [todaySales, setTodaySales] = useState(null);
  const [paymentStats, setPaymentStats] = useState({ cash: 0, card: 0, upi: 0, total: 0, count: 0 });

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
      fetchTodaySales();
      fetchPaymentStats();
    }
  }, [currentCompany]);

  const fetchDashboardData = async () => {
    try {
      setLoadingState(true);
      setLoading(true);
      setError(null);

      const data = await dashboardService.getOverview(currentCompany.id);
      
      setDashboardData(data);
      setSalesData(data.salesData || []);
      setTransactions(data.recentTransactions || []);
      setTopCustomers(data.topCustomers || []);
      setLowStockItems(data.lowStockItems || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  const fetchTodaySales = async () => {
    try {
      const data = await dashboardService.getTodaySales(currentCompany.id);
      setTodaySales(data);
    } catch (error) {
      console.error('Error fetching today sales:', error);
      setTodaySales({ total: 0, orders: 0, payment_breakdown: { cash: 0, card: 0, upi: 0 }, average: 0 });
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const stats = await voucherService.getPaymentStats(currentCompany.id, startDate, endDate);
      setPaymentStats(stats || { cash: 0, card: 0, upi: 0, total: 0, count: 0 });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      setPaymentStats({ cash: 0, card: 0, upi: 0, total: 0, count: 0 });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => { fetchDashboardData(); fetchTodaySales(); fetchPaymentStats(); }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
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
            onClick={() => { fetchDashboardData(); fetchTodaySales(); fetchPaymentStats(); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Today's Sales Card */}
      {todaySales && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today's Sales</h2>
            <TrendingUp className="w-6 h-6 text-white/80" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-white/80">Total Sales</p>
              <p className="text-3xl font-bold">{formatCurrency(todaySales.total)}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Orders</p>
              <p className="text-2xl font-bold">{todaySales.orders}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Average Order</p>
              <p className="text-2xl font-bold">{formatCurrency(todaySales.average)}</p>
            </div>
            <div>
              <p className="text-sm text-white/80">Payment Breakdown</p>
              <div className="flex gap-2 mt-1">
                <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-xs">{formatCurrency(todaySales.payment_breakdown?.cash || 0)}</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                  <CreditCard className="w-3 h-3" />
                  <span className="text-xs">{formatCurrency(todaySales.payment_breakdown?.card || 0)}</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 rounded px-2 py-1">
                  <Wallet className="w-3 h-3" />
                  <span className="text-xs">{formatCurrency(todaySales.payment_breakdown?.upi || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards stats={dashboardData} />
      
      {/* ✅ Payment Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Payment Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Cash</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(paymentStats.cash)}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Card</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(paymentStats.card)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">UPI</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(paymentStats.upi)}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(paymentStats.total)}
            </p>
            <p className="text-xs text-gray-400">{paymentStats.count} orders</p>
          </div>
        </div>
      </div>

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