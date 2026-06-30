import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Calendar, FileText, Truck, Phone, Building2, CreditCard, DollarSign, ShoppingBag, History } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStore } from '../../store/companyStore';
import { supplierService } from '../../services/supplier.service';
import toast from 'react-hot-toast';

export const SupplierDetails = ({ supplier, onClose }) => {
  const { currentCompany } = useCompanyStore();
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'payments'

  useEffect(() => {
    if (supplier) {
      fetchPurchaseHistory();
    }
  }, [supplier]);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getPurchaseHistory(currentCompany.id, supplier.id);
      setPurchaseHistory(data || []);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      toast.error('Failed to load purchase history');
    } finally {
      setLoading(false);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success('PDF download coming soon');
  };

  if (!supplier) return null;

  // Calculate totals
  const totalPurchases = purchaseHistory.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {supplier.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supplier Details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Supplier Info Cards */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-200 dark:border-gray-700">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {supplier.contact_number || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">GST Number</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {supplier.gst_number || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Purchases</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(totalPurchases)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        {supplier.address && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>{supplier.address}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'purchases'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Purchase History
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'payments'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Payment History
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'purchases' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Purchase History
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {purchaseHistory.length} transactions
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading purchases...</p>
                  </div>
                </div>
              ) : purchaseHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No purchase history
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    No purchases recorded from this supplier
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Voucher No.
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Narration
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {purchaseHistory.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(purchase.date), 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">
                            {purchase.voucher_number}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                            {purchase.narration || '-'}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(purchase.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                          Total
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">
                          {formatCurrency(totalPurchases)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Payment History
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Coming soon
                </span>
              </div>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Payment History Coming Soon
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Payment tracking will be available in the next update
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};