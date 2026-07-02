import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  ChevronDown,
  RefreshCw,
  Users,
  Building2,
  Landmark,
  Wallet,
  Package,
  TrendingUp,      // Add this
  TrendingDown,    // Add this
  DollarSign,      // Add this
  FileText,        // Add this
  User             // Add this
} from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useLedgerStore } from '../../store/ledgerStore';
import { ledgerService } from '../../services/ledger.service';
import toast from 'react-hot-toast';

const LEDGER_TYPES = [
  { value: 'CUSTOMER', label: 'Customer', icon: Users },
  { value: 'SUPPLIER', label: 'Supplier', icon: Building2 },
  { value: 'BANK', label: 'Bank', icon: Landmark },
  { value: 'CASH', label: 'Cash', icon: Wallet },
  { value: 'STOCK', label: 'Stock', icon: Package },
  { value: 'INCOME', label: 'Income', icon: TrendingUp },
  { value: 'EXPENSE', label: 'Expense', icon: TrendingDown },
  { value: 'ASSET', label: 'Asset', icon: DollarSign },
  { value: 'LIABILITY', label: 'Liability', icon: FileText },
  { value: 'EQUITY', label: 'Equity', icon: User }
];

const getTypeIcon = (type) => {
  const found = LEDGER_TYPES.find(t => t.value === type);
  return found?.icon || Users;
};

const getTypeColor = (type) => {
  const colors = {
    CUSTOMER: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    SUPPLIER: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    BANK: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    CASH: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    STOCK: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    INCOME: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    EXPENSE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    ASSET: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    LIABILITY: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    EQUITY: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
  };
  return colors[type] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
};

export const LedgerList = ({ onEdit, onView, onDelete, onAdd }) => {
  const { currentCompany } = useCompanyStore();
  const { ledgers, setLedgers, isLoading, setLoading } = useLedgerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);

  useEffect(() => {
    if (currentCompany) {
      fetchLedgers();
    }
  }, [currentCompany]);

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterType) filters.type = filterType;
      if (filterStatus) filters.status = filterStatus;

      const data = await ledgerService.getAll(currentCompany.id, filters);
      setLedgers(data);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      toast.error('Failed to load ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLedgers();
  };

const handleDelete = async (ledger) => {
    if (!window.confirm(`Are you sure you want to delete "${ledger.name}"?`)) {
        return;
    }

    try {
        const response = await ledgerService.delete(currentCompany.id, ledger.id);
        
        if (response.deactivated) {
            toast.warning(response.message || 'Ledger has transactions and has been deactivated');
        } else {
            toast.success('Ledger deleted successfully');
        }
        
        fetchLedgers();
        if (onDelete) onDelete(ledger);
    } catch (error) {
        console.error('Error deleting ledger:', error);
        const message = error.response?.data?.message || error.message || 'Failed to delete ledger';
        
        if (error.response?.status === 409) {
            toast.warning('Ledger has transactions. It has been deactivated instead of deleted.');
        } else {
            toast.error(message);
        }
    }
};

  const handleRefresh = () => {
    fetchLedgers();
    toast.success('Refreshed');
  };

  const filteredLedgers = ledgers || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ledgers
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your account ledgers
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Ledger
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ledgers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ledger Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {LEDGER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setSearchTerm('');
                  fetchLedgers();
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchLedgers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ml-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ledger List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ledgers...</p>
          </div>
        </div>
      ) : filteredLedgers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📒</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No ledgers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || filterType || filterStatus 
              ? 'Try adjusting your search or filters' 
              : 'Create your first ledger to get started'}
          </p>
          {!searchTerm && !filterType && !filterStatus && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Ledger
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Group
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
              {filteredLedgers.map((ledger) => {
                const TypeIcon = getTypeIcon(ledger.ledger_type);
                const typeColor = getTypeColor(ledger.ledger_type);
                
                return (
                  <tr key={ledger.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeColor}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{ledger.name}</p>
                          {ledger.mobile && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ledger.mobile}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}>
                        {LEDGER_TYPES.find(t => t.value === ledger.ledger_type)?.label || ledger.ledger_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {ledger.account_groups?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ledger.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {ledger.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(ledger)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Statement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(ledger)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ledger)}
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredLedgers.length} ledger{filteredLedgers.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};