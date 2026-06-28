import React from 'react';
import { AlertTriangle, Package, ChevronRight } from 'lucide-react';

const StockItem = ({ item }) => {
  const percentage = (item.currentQuantity / item.reorderLevel) * 100;
  const isCritical = percentage < 50;
  const isWarning = percentage < 75;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          isCritical ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <Package className={`w-4 h-4 ${
            isCritical ? 'text-red-500' : 'text-yellow-500'
          }`} />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            SKU: {item.sku} • {item.unit}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 dark:text-white">
          {item.currentQuantity} {item.unit}
        </p>
        <div className="flex items-center gap-2 justify-end">
          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Reorder at: {item.reorderLevel} {item.unit}
        </p>
      </div>
    </div>
  );
};

export const LowStockAlert = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Low Stock Alerts
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">All stock levels are healthy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Low Stock Alerts
          </h3>
          <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-full">
            {items.length}
          </span>
        </div>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          Manage Stock
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.slice(0, 5).map((item) => (
          <StockItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};