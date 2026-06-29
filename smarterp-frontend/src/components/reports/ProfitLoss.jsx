import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Download, Printer, Calendar } from 'lucide-react';

export const ProfitLoss = () => {
    const { currentCompany } = useCompanyStore();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (currentCompany) {
            fetchReport();
        }
    }, [currentCompany, startDate, endDate]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await reportService.getProfitLoss(currentCompany.id, startDate, endDate);
            setReport(data);
        } catch (error) {
            console.error('Error fetching profit & loss:', error);
            toast.error('Failed to load profit & loss report');
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
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profit & loss...</p>
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Profit & Loss Statement
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')}
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
                        Income
                    </h3>
                    <div className="space-y-2">
                        {report.income.ledgers.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {formatCurrency(item.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                            <span>Total Income</span>
                            <span className="text-green-600 dark:text-green-400">{formatCurrency(report.income.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Expenses
                    </h3>
                    <div className="space-y-2">
                        {report.expenses.ledgers.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(item.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                            <span>Total Expenses</span>
                            <span className="text-red-600 dark:text-red-400">{formatCurrency(report.expenses.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Net Profit/Loss Summary */}
            <div className={`mt-6 p-6 rounded-lg ${
                report.isProfit 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net {report.isProfit ? 'Profit' : 'Loss'}</p>
                        <p className={`text-3xl font-bold ${
                            report.isProfit 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                        }`}>
                            {formatCurrency(report.netProfit)}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Income</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(report.income.total)}
                            </p>
                        </div>
                        <div className="text-2xl text-gray-400">−</div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
                            <p className="font-semibold text-red-600 dark:text-red-400">
                                {formatCurrency(report.expenses.total)}
                            </p>
                        </div>
                        <div className="text-2xl text-gray-400">=</div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Net {report.isProfit ? 'Profit' : 'Loss'}</p>
                            <p className={`font-bold text-lg ${
                                report.isProfit 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {formatCurrency(report.netProfit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};