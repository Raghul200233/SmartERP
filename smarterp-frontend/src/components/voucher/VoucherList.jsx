import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Eye, Edit, Trash2, Filter, ChevronDown,
  RefreshCw, FileText, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownLeft, Building2, Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStore } from '../../store/companyStore';
import { useVoucherStore } from '../../store/voucherStore';
import { voucherService } from '../../services/voucher.service';
import toast from 'react-hot-toast';

const VOUCHER_TYPE_ICONS = {
  PURCHASE: TrendingUp,
  SALES: TrendingDown,
  PAYMENT: ArrowUpRight,
  RECEIPT: ArrowDownLeft,
  CONTRA: Building2,
  JOURNAL: FileText,
  CREDIT_NOTE: ArrowUpRight,
  DEBIT_NOTE: ArrowDownLeft
};

const VOUCHER_TYPE_COLORS = {
  PURCHASE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  SALES: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  PAYMENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  RECEIPT: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  CONTRA: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  JOURNAL: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  CREDIT_NOTE: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  DEBIT_NOTE: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
};

export const VoucherList = ({ vouchers: propVouchers, isLoading: propLoading, onEdit, onView, onAdd }) => {
  const { currentCompany } = useCompanyStore();
  const { vouchers: storeVouchers, setVouchers, isLoading: storeLoading } = useVoucherStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use prop vouchers if provided, otherwise use store
  const vouchers = propVouchers || storeVouchers || [];
  const isLoading = propLoading !== undefined ? propLoading : storeLoading;


  useEffect(() => {
    if (currentCompany) {
      fetchVouchers();
      fetchVoucherTypes();
    }
  }, [currentCompany]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterType) filters.type = filterType;
      if (filterStatus) filters.status = filterStatus;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const data = await voucherService.getAll(currentCompany.id, filters);
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherTypes = async () => {
    try {
      const types = await voucherService.getTypes(currentCompany.id);
      setVoucherTypes(types);
    } catch (error) {
      console.error('Error fetching voucher types:', error);
    }
  };

  const handleDelete = async (voucher) => {
    if (!window.confirm(`Are you sure you want to delete voucher ${voucher.voucher_number}?`)) {
      return;
    }

    try {
      await voucherService.delete(currentCompany.id, voucher.id);
      toast.success('Voucher deleted successfully');
      fetchVouchers();
    } catch (error) {
      console.error('Error deleting voucher:', error);
      toast.error(error.response?.data?.message || 'Failed to delete voucher');
    }
  };

  const handleRefresh = () => {
    fetchVouchers();
    toast.success('Refreshed');
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      POSTED: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[status] || colors.DRAFT;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

   const filteredVouchers = Array.isArray(vouchers) ? vouchers : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Vouchers
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all your accounting vouchers
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Voucher
          </button>
        </div>
<div className="flex flex-wrap items-center gap-2">
  <button
    onClick={() => onAdd('PURCHASE')}
    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
  >
    Purchase
  </button>
  <button
    onClick={() => onAdd('SALES')}
    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
  >
    Sales
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
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchVouchers()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={fetchVouchers}
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voucher Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Types</option>
                {voucherTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
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
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  fetchVouchers();
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchVouchers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ml-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voucher List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vouchers...</p>
          </div>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No vouchers found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || filterType || filterStatus || startDate || endDate
              ? 'Try adjusting your search or filters'
              : 'Create your first voucher to get started'}
          </p>
          {!searchTerm && !filterType && !filterStatus && !startDate && !endDate && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Voucher
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Voucher No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ledger
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
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
                {Array.isArray(filteredVouchers) && filteredVouchers.map((voucher) => {
                const Icon = VOUCHER_TYPE_ICONS[voucher.voucher_type] || FileText;
                const colorClass = VOUCHER_TYPE_COLORS[voucher.voucher_type] || 'bg-gray-100 text-gray-600';
                const statusColor = getStatusColor(voucher.status);

                return (
                  <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-gray-900 dark:text-white">
                        {voucher.voucher_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        <Icon className="w-3 h-3" />
                        {voucher.voucher_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(voucher.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {voucher.ledgers?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(voucher.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {voucher.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onView(voucher)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(voucher)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher)}
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
          Showing {filteredVouchers.length} voucher{filteredVouchers.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};