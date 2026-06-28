import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Eye } from 'lucide-react';

const TransactionItem = ({ transaction }) => {
  const isCredit = transaction.type === 'CREDIT';
  const Icon = isCredit ? ArrowUpRight : ArrowDownLeft;
  const color = isCredit ? 'text-green-500' : 'text-red-500';
  const bgColor = isCredit ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.reference}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`font-semibold ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
          {isCredit ? '+' : '-'}₹{transaction.amount.toLocaleString()}
        </span>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export const RecentTransactions = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No recent transactions
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          View All
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {transactions.slice(0, 5).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
};