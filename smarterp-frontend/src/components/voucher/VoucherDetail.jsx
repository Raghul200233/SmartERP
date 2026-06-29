import React from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const VoucherDetail = ({ voucher, onClose }) => {
  if (!voucher) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success('PDF download coming soon');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Voucher Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {voucher.voucher_number}
            </p>
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
              title="Download PDF"
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

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Voucher Type</p>
              <p className="font-medium text-gray-900 dark:text-white">{voucher.voucher_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(new Date(voucher.date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ledger</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {voucher.ledgers?.name || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className={`font-medium ${
                voucher.status === 'POSTED' ? 'text-green-600' : 
                voucher.status === 'CANCELLED' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {voucher.status}
              </p>
            </div>
            {voucher.reference_number && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reference</p>
                <p className="font-medium text-gray-900 dark:text-white">{voucher.reference_number}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(voucher.amount)}
              </p>
            </div>
          </div>

          {voucher.narration && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">Narration</p>
              <p className="text-gray-900 dark:text-white">{voucher.narration}</p>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Voucher Entries
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ledger
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {voucher.voucher_entries?.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {entry.ledgers?.name || '-'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          entry.entry_type === 'DEBIT' 
                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {entry.entry_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(voucher.amount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};