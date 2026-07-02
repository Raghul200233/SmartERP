const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class DashboardController {
async getOverview(req, res, next) {
    try {
        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        // Initialize with default values
        const response = {
            todaySales: 0,
            todayPurchases: 0,
            totalCustomers: 0,
            totalLedgers: 0,
            stockValue: 0,
            lowStockItems: [],
            recentTransactions: [],
            topCustomers: [],
            salesData: [],
            todayOrders: 0,
            todayPurchaseOrders: 0,
            receivables: 0,
            payables: 0,
            salesTrend: 0,
            purchaseTrend: 0,
            customersTrend: 0,
            stockTrend: 0,
            receivablesTrend: 0,
            payablesTrend: 0
        };

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        try {
            // Get today's sales
            const { data: salesData, error: salesError } = await supabase
                .from('vouchers')
                .select('amount')
                .eq('voucher_type', 'SALES')
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .is('deleted_at', null);

            if (!salesError && salesData) {
                response.todaySales = salesData.reduce((sum, v) => sum + (v.amount || 0), 0);
                response.todayOrders = salesData.length;
            }
        } catch (e) {
            console.error('Error fetching sales:', e);
        }

        try {
            // Get total customers
            const { count: totalCustomers, error: customersError } = await supabase
                .from('customers')
                .select('*', { count: 'exact' })
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (!customersError) {
                response.totalCustomers = totalCustomers || 0;
            }
        } catch (e) {
            console.error('Error fetching customers:', e);
        }

        try {
            // Get stock value
            const { data: stockData, error: stockError } = await supabase
                .from('stock_items')
                .select('current_quantity, purchase_price')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (!stockError && stockData) {
                response.stockValue = stockData.reduce((sum, item) => 
                    sum + ((item.current_quantity || 0) * (item.purchase_price || 0)), 0
                );
            }
        } catch (e) {
            console.error('Error fetching stock:', e);
        }

        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch dashboard data'
        });
    }
}

    async getTodaySales(req, res, next) {
    try {
        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's sales
        const { data: salesData, error: salesError } = await supabase
            .from('vouchers')
            .select('amount, payment_type')
            .eq('voucher_type', 'SALES')
            .eq('company_id', companyId)
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .is('deleted_at', null);

        if (salesError) throw salesError;

        const totalSales = salesData?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
        const orderCount = salesData?.length || 0;

        // Breakdown by payment type
        const paymentBreakdown = {
            cash: 0,
            card: 0,
            upi: 0
        };

        salesData?.forEach(sale => {
            const paymentType = sale.payment_type?.toLowerCase() || 'cash';
            if (paymentBreakdown[paymentType] !== undefined) {
                paymentBreakdown[paymentType] += sale.amount || 0;
            }
        });

        res.json({
            success: true,
            data: {
                total: totalSales,
                orders: orderCount,
                payment_breakdown: paymentBreakdown,
                average: orderCount > 0 ? totalSales / orderCount : 0
            }
        });
    } catch (error) {
        logger.error('Get today sales error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch today sales'
        });
    }
}

    async getMonthlySales(companyId) {
        try {
            const months = [];
            const now = new Date();
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now);
                date.setMonth(date.getMonth() - i);
                months.push({
                    month: date.toLocaleString('default', { month: 'short' }),
                    year: date.getFullYear(),
                    start: new Date(date.getFullYear(), date.getMonth(), 1),
                    end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
                });
            }

            const results = [];

            for (const month of months) {
                const { data: sales, error: salesError } = await supabase
                    .from('vouchers')
                    .select('amount')
                    .eq('voucher_type', 'SALES')
                    .eq('company_id', companyId)
                    .gte('date', month.start.toISOString().split('T')[0])
                    .lte('date', month.end.toISOString().split('T')[0])
                    .is('deleted_at', null);

                if (salesError) {
                    logger.error('Error fetching monthly sales:', salesError);
                    continue;
                }

                const totalSales = sales?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

                const { data: purchases, error: purchaseError } = await supabase
                    .from('vouchers')
                    .select('amount')
                    .eq('voucher_type', 'PURCHASE')
                    .eq('company_id', companyId)
                    .gte('date', month.start.toISOString().split('T')[0])
                    .lte('date', month.end.toISOString().split('T')[0])
                    .is('deleted_at', null);

                if (purchaseError) {
                    logger.error('Error fetching monthly purchases:', purchaseError);
                    continue;
                }

                const totalPurchases = purchases?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

                results.push({
                    name: month.month,
                    sales: totalSales,
                    purchases: totalPurchases
                });
            }

            return results;
        } catch (error) {
            logger.error('Error getting monthly sales:', error);
            return [];
        }
    }
}

module.exports = new DashboardController();