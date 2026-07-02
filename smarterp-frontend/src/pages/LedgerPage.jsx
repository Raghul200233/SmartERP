import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { useLedgerStore } from '../store/ledgerStore';
import { ledgerService } from '../services/ledger.service';
import { voucherService } from '../services/voucher.service';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, Clock, DollarSign, Wallet, CreditCard, Landmark, X } from 'lucide-react';

const LedgerPage = () => {
  const { currentCompany } = useCompanyStore();
  const { ledgers, setLedgers, setLoading } = useLedgerStore();
  const [showStatement, setShowStatement] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [statement, setStatement] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchLedgers();
    }
  }, [currentCompany]);

  const fetchLedgers = async () => {
    try {
      setIsLoading(true);
      const response = await ledgerService.getAll(currentCompany.id);
      // Filter only SUPPLIER ledgers
      const supplierLedgers = (response.data || []).filter(l => l.ledger_type === 'SUPPLIER');
      setLedgers(supplierLedgers);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      toast.error('Failed to load ledgers');
      setLedgers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (ledger) => {
    setSelectedLedger(ledger);
    await fetchStatement(ledger.id);
    setShowStatement(true);
  };

  const fetchStatement = async (ledgerId) => {
    try {
      const data = await voucherService.getLedgerStatement(currentCompany.id, ledgerId);
      setStatement(data);
    } catch (error) {
      console.error('Error fetching statement:', error);
      toast.error('Failed to load statement');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedVoucher) return;

    try {
      const amount = paymentAmount || selectedVoucher.amount;
      await voucherService.markAsPaid(
        currentCompany.id,
        selectedVoucher.id,
        paymentMethod,
        amount
      );
      toast.success('Payment marked as paid successfully!');
      setShowPaymentModal(false);
      setSelectedVoucher(null);
      await fetchStatement(selectedLedger.id);
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to mark as paid');
    }
  };

  const openPaymentModal = (voucher) => {
    setSelectedVoucher(voucher);
    setPaymentAmount(voucher.amount);
    setPaymentMethod('CASH');
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH': return <DollarSign className="w-4 h-4" />;
      case 'CARD': return <CreditCard className="w-4 h-4" />;
      case 'UPI': return <Wallet className="w-4 h-4" />;
      case 'BANK_TRANSFER': return <Landmark className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Suppliers & Dues
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View all suppliers and their outstanding dues
            </p>
          </div>

          {/* Ledger List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Purchases
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Outstanding Dues
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {ledgers.map((ledger) => {
                  const totalPurchases = 0; // Calculate from statement
                  const totalPaid = 0;
                  const outstanding = 0;
                  
                  return (
                    <tr key={ledger.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {ledger.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{ledger.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{ledger.mobile || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(totalPurchases)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleView(ledger)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Statement Modal */}
      {showStatement && selectedLedger && statement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedLedger.name} - Statement
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Dues: {formatCurrency(statement.totalDues)}
                </p>
              </div>
              <button
                onClick={() => setShowStatement(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(statement.transactions?.filter(t => t.voucher_type === 'PURCHASE').reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(statement.totalPaid)}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Outstanding Dues</p>
                  <p className={`text-2xl font-bold ${statement.totalDues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(statement.totalDues)}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {statement.transactions?.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2 text-sm">{new Date(voucher.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm font-mono">{voucher.voucher_number}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            voucher.voucher_type === 'PURCHASE' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {voucher.voucher_type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-red-600">
                          {voucher.debit > 0 ? formatCurrency(voucher.debit) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-green-600">
                          {voucher.credit > 0 ? formatCurrency(voucher.credit) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-bold">
                          {formatCurrency(voucher.running_balance)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {voucher.voucher_type === 'PURCHASE' && voucher.payment_status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <Clock className="w-3 h-3" />
                              Due
                            </span>
                          ) : voucher.voucher_type === 'PURCHASE' && voucher.payment_status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Paid
                              <span className="text-xs text-gray-500">
                                ({new Date(voucher.paid_at).toLocaleDateString()})
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {voucher.voucher_type === 'PURCHASE' && voucher.payment_status === 'PENDING' && (
                            <button
                              onClick={() => openPaymentModal(voucher)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Mark as Paid
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Voucher: {selectedVoucher.voucher_number}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Amount: {formatCurrency(selectedVoucher.amount)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;