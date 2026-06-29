import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Download, Printer, Calendar, TrendingUp, ShoppingCart } from 'lucide-react';

export const SalesReport = () => {
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
            const data = await reportService.getSalesReport(currentCompany.id, startDate, endDate);
            setReport(data);
        } catch (error) {
            console.error('Error fetching sales report:', error);
            toast.error('Failed to load sales report');
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
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sales report...</p>
                </div>
            </div>
        );
    }

    if (!report || report.sales.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No sales found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    No sales transactions found for this period
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
                        Sales Report
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {report.summary.total_sales}
                            </p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(report.summary.total_amount)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Average Sale</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(report.summary.average)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Voucher No.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Narration
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {report.sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                                    {sale.voucher_number}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                    {format(new Date(sale.date), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                    {sale.ledgers?.name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(sale.amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                    {sale.narration || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                Total
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                {formatCurrency(report.summary.total_amount)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};