import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../../store/companyStore';
import { reportService } from '../../services/report.service';
import toast from 'react-hot-toast';
import { Download, Printer, Package, AlertTriangle } from 'lucide-react';

export const StockSummary = () => {
    const { currentCompany } = useCompanyStore();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterGroup, setFilterGroup] = useState('');

    useEffect(() => {
        if (currentCompany) {
            fetchReport();
        }
    }, [currentCompany]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await reportService.getStockSummary(currentCompany.id);
            setReport(data);
        } catch (error) {
            console.error('Error fetching stock summary:', error);
            toast.error('Failed to load stock summary');
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

    const filteredItems = report?.items?.filter(item => 
        !filterGroup || item.stock_groups?.id === filterGroup
    ) || [];

    const uniqueGroups = [...new Set(report?.items?.map(item => item.stock_groups?.id))].filter(Boolean);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stock summary...</p>
                </div>
            </div>
        );
    }

    if (!report || report.items.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No stock items found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Add some stock items to see the summary
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
                        Stock Summary
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Items: {report.summary.total_items}
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                        <option value="">All Groups</option>
                        {uniqueGroups.map(groupId => {
                            const group = report.items.find(i => i.stock_groups?.id === groupId);
                            return group ? (
                                <option key={groupId} value={groupId}>
                                    {group.stock_groups.name}
                                </option>
                            ) : null;
                        })}
                    </select>
                    <button
                        onClick={fetchReport}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                        Refresh
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {report.summary.total_items}
                    </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {report.summary.total_quantity}
                    </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(report.summary.total_value)}
                    </p>
                </div>
            </div>

            {/* Stock Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Item
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Group
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Purchase Price
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Stock Value
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredItems.map((item) => {
                            const isLowStock = item.current_quantity <= item.reorder_level;
                            return (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Package className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {item.sku || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {item.stock_groups?.name || 'Uncategorized'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                        {item.current_quantity || 0} {item.units?.symbol || ''}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(item.purchase_price)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(item.stock_value)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isLowStock ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                                <AlertTriangle className="w-3 h-3" />
                                                Low Stock
                                            </span>
                                        ) : (
                                            <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                In Stock
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white" colSpan="4">
                                Total
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                {formatCurrency(filteredItems.reduce((sum, i) => sum + i.stock_value, 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};