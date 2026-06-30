import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanyStore } from '../../store/companyStore';
import { ledgerService } from '../../services/ledger.service';
import toast from 'react-hot-toast';

export const LedgerStatement = ({ ledger, onClose }) => {
  const { currentCompany } = useCompanyStore();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (ledger) {
      fetchStatement();
    }
  }, [ledger]);

  const fetchStatement = async () => {
    try {
      setLoading(true);
      const data = await ledgerService.getStatement(
        currentCompany.id,
        ledger.id,
        startDate || undefined,
        endDate || undefined
      );
      setStatement(data);
    } catch (error) {
      console.error('Error fetching statement:', error);
      toast.error('Failed to load ledger statement');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchStatement();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast.success('PDF download coming soon');
  };

  if (!ledger) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ledger Statement
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ledger.name} - {ledger.ledger_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                fetchStatement();
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Clear
            </button>
            <div className="flex-1"></div>
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        {/* Statement Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statement...</p>
            </div>
          </div>
        ) : !statement || statement.statement?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No transactions recorded for this ledger
            </p>
          </div>
        ) : (
          <div className="p-6 print:p-4">
            {/* Header */}
            <div className="text-center mb-6 print:mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {statement.ledger?.name}
              </h3>
            </div>

            {/* Table */}
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
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Narration
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {statement.statement.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {entry.voucher_number}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          {entry.voucher_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                        {entry.narration || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">
                        ₹{entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <td colSpan="6" className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                      Closing Balance
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-lg text-blue-600 dark:text-blue-400">
                      ₹{statement.closing_balance?.toLocaleString() || '0'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};