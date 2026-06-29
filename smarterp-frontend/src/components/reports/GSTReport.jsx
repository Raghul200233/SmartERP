import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Download, Printer, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export const GSTReport = () => {
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
            const data = await reportService.getGSTReport(currentCompany.id, startDate, endDate);
            setReport(data);
        } catch (error) {
            console.error('Error fetching GST report:', error);
            toast.error('Failed to load GST report');
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
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading GST report...</p>
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
                        GST Report
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sales</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.sales.count}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total: {formatCurrency(report.sales.total_amount)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                GST: {formatCurrency(report.sales.gst_amount)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Purchases</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.purchases.count}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total: {formatCurrency(report.purchases.total_amount)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                GST: {formatCurrency(report.purchases.gst_amount)}
                            </p>
                        </div>
                        <TrendingDown className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className={`rounded-lg p-4 ${
                    report.isPayable 
                        ? 'bg-red-50 dark:bg-red-900/20' 
                        : 'bg-green-50 dark:bg-green-900/20'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Net GST</p>
                            <p className={`text-2xl font-bold ${
                                report.isPayable 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-green-600 dark:text-green-400'
                            }`}>
                                {formatCurrency(report.net_gst)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {report.isPayable ? 'Payable' : 'Receivable'}
                            </p>
                        </div>
                        {report.isPayable ? (
                            <TrendingUp className="w-8 h-8 text-red-500" />
                        ) : (
                            <TrendingDown className="w-8 h-8 text-green-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* GST Breakdown Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Count
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Total Amount
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                GST Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                Sales
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                {report.sales.count}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                {formatCurrency(report.sales.total_amount)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-blue-600 dark:text-blue-400">
                                {formatCurrency(report.sales.gst_amount)}
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                Purchases
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                                {report.purchases.count}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                                {formatCurrency(report.purchases.total_amount)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                                {formatCurrency(report.purchases.gst_amount)}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                Net GST
                            </td>
                            <td></td>
                            <td></td>
                            <td className={`px-4 py-3 text-right font-bold text-lg ${
                                report.isPayable 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-green-600 dark:text-green-400'
                            }`}>
                                {formatCurrency(report.net_gst)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};