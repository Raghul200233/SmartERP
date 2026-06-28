import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign,
  ShoppingCart,
  FileText
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle }) => {
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500';
  const trendIcon = trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              {trendIcon}
              <span>{Math.abs(trend)}%</span>
              <span className="text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Today\'s Sales',
      value: `₹${stats?.todaySales?.toLocaleString() || '0'}`,
      icon: ShoppingCart,
      trend: stats?.salesTrend || 0,
      color: 'bg-blue-500',
      subtitle: `${stats?.todayOrders || 0} orders`
    },
    {
      title: 'Today\'s Purchases',
      value: `₹${stats?.todayPurchases?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      trend: stats?.purchaseTrend || 0,
      color: 'bg-green-500',
      subtitle: `${stats?.todayPurchaseOrders || 0} orders`
    },
    {
      title: 'Outstanding Receivables',
      value: `₹${stats?.receivables?.toLocaleString() || '0'}`,
      icon: DollarSign,
      trend: stats?.receivablesTrend || 0,
      color: 'bg-yellow-500'
    },
    {
      title: 'Outstanding Payables',
      value: `₹${stats?.payables?.toLocaleString() || '0'}`,
      icon: FileText,
      trend: stats?.payablesTrend || 0,
      color: 'bg-red-500'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || '0',
      icon: Users,
      trend: stats?.customersTrend || 0,
      color: 'bg-purple-500'
    },
    {
      title: 'Stock Value',
      value: `₹${stats?.stockValue?.toLocaleString() || '0'}`,
      icon: Package,
      trend: stats?.stockTrend || 0,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};