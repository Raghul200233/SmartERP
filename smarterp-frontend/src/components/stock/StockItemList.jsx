import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Eye, Filter, ChevronDown, 
  RefreshCw, Package, AlertTriangle, TrendingUp, TrendingDown 
} from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useStockStore } from '../../store/stockStore';
import { stockItemService, stockGroupService, unitService } from '../../services/stock.service';
import toast from 'react-hot-toast';

export const StockItemList = ({ onEdit, onView, onDelete, onAdd }) => {
  const { currentCompany } = useCompanyStore();
  const { stockItems, setStockItems, isLoading, setLoading } = useStockStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    if (currentCompany) {
      fetchStockItems();
      fetchStockGroups();
      fetchUnits();
    }
  }, [currentCompany]);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterGroup) filters.groupId = filterGroup;

      const response = await stockItemService.getAll(currentCompany.id, filters);
      // Ensure we set an array
      setStockItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      toast.error('Failed to load stock items');
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockGroups = async () => {
    try {
      const response = await stockGroupService.getAll(currentCompany.id);
      setStockGroups(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching stock groups:', error);
      setStockGroups([]);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitService.getAll(currentCompany.id);
      setUnits(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    }
  };

const handleDelete = async (item) => {
  if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
    return;
  }

  try {
    await stockItemService.delete(currentCompany.id, item.id);
    toast.success('Stock item deleted successfully');
    fetchStockItems();
    if (onDelete) onDelete(item);
  } catch (error) {
    console.error('Error deleting stock item:', error);
    toast.error(error.response?.data?.message || 'Failed to delete stock item');
  }
};

  const handleRefresh = () => {
    fetchStockItems();
    toast.success('Refreshed');
  };

  const getStockStatus = (item) => {
    if (item.current_quantity <= 0) {
      return { label: 'Out of Stock', color: 'text-red-500', icon: TrendingDown };
    }
    return { label: 'Low Stock', color: 'text-yellow-500', icon: AlertTriangle };
  };

  const filteredItems = Array.isArray(stockItems) ? stockItems : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Stock Items
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your inventory items
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Item
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchStockItems()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={fetchStockItems}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Group
              </label>
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Groups</option>
                {stockGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end items-end">
              <button
                onClick={() => {
                  setFilterGroup('');
                  setSearchTerm('');
                  fetchStockItems();
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchStockItems}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ml-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stock items...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No stock items found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || filterGroup 
              ? 'Try adjusting your search or filters' 
              : 'Add your first stock item to start managing inventory'}
          </p>
          {!searchTerm && !filterGroup && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Stock Item
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(filteredItems) && filteredItems.map((item) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                const unit = units.find(u => u.id === item.unit_id);

                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          {item.barcode && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Barcode: {item.barcode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {item.sku || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.stock_groups?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      ₹{item.selling_price?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.current_quantity || 0}
                        </span>
                        {unit && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {unit.symbol}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

// Helper function at the bottom
const getStockStatus = (item) => {
  if (item.current_quantity <= 0) {
    return { label: 'Out of Stock', color: 'text-red-500', icon: TrendingDown };
  }
  return { label: 'Low Stock', color: 'text-yellow-500', icon: AlertTriangle };
};