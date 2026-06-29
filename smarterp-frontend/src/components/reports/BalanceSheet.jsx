import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const BalanceSheet = () => {
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
            const data = await reportService.getBalanceSheet(currentCompany.id, asOnDate);
            setReport(data);
        } catch (error) {
            console.error('Error fetching balance sheet:', error);
            toast.error('Failed to load balance sheet');
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading balance sheet...</p>
                </div>
            </div>
        );
    }

    if (!report) {
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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Balance Sheet
                </h2>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={asOnDate}
                        onChange={(e) => setAsOnDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        onClick={fetchReport}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Assets
                    </h3>
                    <div className="space-y-2">
                        {report.assets.ledgers.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(item.balance)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                            <span>Total Assets</span>
                            <span>{formatCurrency(report.assets.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Liabilities
                        </h3>
                        <div className="space-y-2">
                            {report.liabilities.ledgers.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(item.balance)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                                <span>Total Liabilities</span>
                                <span>{formatCurrency(report.liabilities.total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Equity
                        </h3>
                        <div className="space-y-2">
                            {report.equity.ledgers.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(item.balance)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                                <span>Total Equity</span>
                                <span>{formatCurrency(report.equity.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Assets</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(report.assets.total)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Liabilities + Equity</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(report.totalLiabilitiesEquity)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                        <p className={`text-lg font-bold ${report.isBalanced ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {report.isBalanced ? '✓ Balanced' : '✗ Not Balanced'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};