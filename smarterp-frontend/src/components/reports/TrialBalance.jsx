import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Download, Printer, Calendar, CheckCircle, XCircle } from 'lucide-react';

export const TrialBalance = () => {
    const { currentCompany } = useCompanyStore();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (currentCompany) {
            fetchReport();
        }
    }, [currentCompany, asOnDate]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await reportService.getTrialBalance(currentCompany.id, asOnDate);
            setReport(data);
        } catch (error) {
            console.error('Error fetching trial balance:', error);
            toast.error('Failed to load trial balance');
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trial balance...</p>
                </div>
            </div>
        );
    }

    if (!report || report.trialBalance.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No data available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    No transactions found for this period
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Trial Balance
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        As on {format(new Date(asOnDate), 'dd/MM/yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={asOnDate}
                            onChange={(e) => setAsOnDate(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                        Apply
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Download PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Print"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Trial Balance Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Ledger
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Debit
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Credit
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {report.trialBalance.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    {item.ledger}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400">
                                    {item.debit > 0 ? formatCurrency(item.debit) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-green-600 dark:text-green-400">
                                    {item.credit > 0 ? formatCurrency(item.credit) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                Totals
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(report.totals.debit)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(report.totals.credit)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Status */}
            <div className={`mt-6 p-4 rounded-lg flex items-center justify-between ${
                report.isBalanced 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
                <div className="flex items-center gap-3">
                    {report.isBalanced ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                    <span className={`font-medium ${
                        report.isBalanced 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                    }`}>
                        {report.isBalanced ? '✓ Trial Balance is Balanced' : '✗ Trial Balance is Not Balanced'}
                    </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Difference: {formatCurrency(Math.abs(report.totals.debit - report.totals.credit))}
                </div>
            </div>
        </div>
    );
};