import React from 'react';
import { User, TrendingUp } from 'lucide-react';

const CustomerItem = ({ customer, rank }) => {
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
  const color = colors[rank % colors.length];

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold`}>
          {rank + 1}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email || 'No email'}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-white">
          ₹{customer.totalSpent?.toLocaleString() || '0'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {customer.orders || 0} orders
        </p>
      </div>
    </div>
  );
};

export const TopCustomers = ({ customers }) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Customers
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No customer data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Customers
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {customers.slice(0, 5).map((customer, index) => (
          <CustomerItem key={customer.id} customer={customer} rank={index} />
        ))}
      </div>
    </div>
  );
};