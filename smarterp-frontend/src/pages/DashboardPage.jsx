import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useVoucherStore } from '../store/voucherStore';
import { useStockStore } from '../store/stockStore';
import { dashboardService } from '../services/dashboard.service';
import { StatsCards } from '../components/dashboard/StatsCards';
import { SalesChart } from '../components/dashboard/SalesChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TopCustomers } from '../components/dashboard/TopCustomers';
import { LowStockAlert } from '../components/dashboard/LowStockAlert';
import { useMainStore } from '../store/mainStore';
import { useDataSync } from '../hooks/useDataSync';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { currentCompany } = useCompanyStore();
  const { dashboardData, setDashboardData, isLoading, setLoading } = useDashboardStore();
  const { lastCreatedVoucher, clearLastCreatedVoucher } = useVoucherStore();
  const { lastUpdatedItem, clearLastUpdatedItem } = useStockStore();
  const { currentCompany } = useCompanyStore();
  const { dashboard, loading } = useMainStore();
  const { refreshAll } = useDataSync(currentCompany?.id);
  const [salesData, setSalesData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoadingState] = useState(true);

  const dashboardData = dashboard;

  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
    }
  }, [currentCompany]);

  // ✅ Listen for voucher creation updates
  useEffect(() => {
    if (lastCreatedVoucher) {
      // Update dashboard with new voucher data
      const isSales = lastCreatedVoucher.voucher_type === 'SALES';
      const amount = lastCreatedVoucher.amount || 0;
      
      setDashboardData({
        [isSales ? 'todaySales' : 'todayPurchases']: 
          (dashboardData[isSales ? 'todaySales' : 'todayPurchases'] || 0) + amount,
        recentTransactions: [
          {
            id: lastCreatedVoucher.id,
            description: lastCreatedVoucher.narration || `${lastCreatedVoucher.voucher_type} Voucher`,
            amount: amount,
            type: isSales ? 'CREDIT' : 'DEBIT',
            date: lastCreatedVoucher.date,
            reference: lastCreatedVoucher.voucher_number
          },
          ...dashboardData.recentTransactions || []
        ].slice(0, 10)
      });

      // Update sales data chart
      const month = new Date(lastCreatedVoucher.date).toLocaleString('default', { month: 'short' });
      setSalesData(prev => {
        const existing = prev.find(d => d.name === month);
        if (existing) {
          return prev.map(d => 
            d.name === month 
              ? { ...d, [isSales ? 'sales' : 'purchases']: (d[isSales ? 'sales' : 'purchases'] || 0) + amount }
              : d
          );
        }
        return [...prev, { name: month, sales: isSales ? amount : 0, purchases: isSales ? 0 : amount }];
      });

      clearLastCreatedVoucher();
    }
  }, [lastCreatedVoucher]);

  // ✅ Listen for stock updates
  useEffect(() => {
    if (lastUpdatedItem) {
      // Update stock in dashboard
      const item = stockItems.find(i => i.id === lastUpdatedItem.id);
      if (item) {
        const newStockValue = dashboardData.stockValue + 
          (lastUpdatedItem.current_quantity - item.current_quantity) * item.purchase_price;
        setDashboardData({ stockValue: newStockValue });
      }
      clearLastUpdatedItem();
    }
  }, [lastUpdatedItem]);

  const fetchDashboardData = async () => {
    try {
      setLoadingState(true);
      setLoading(true);

      const data = await dashboardService.getOverview(currentCompany.id);
      
      setDashboardData(data);
      setSalesData(data.salesData || []);
      setTransactions(data.recentTransactions || []);
      setTopCustomers(data.topCustomers || []);
      setLowStockItems(data.lowStockItems || []);

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
            onClick={fetchDashboardData}
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
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && <StatsCards stats={stats} />}

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