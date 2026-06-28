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

            // Get today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Get today's sales
            const { data: salesData, error: salesError } = await supabase
                .from('vouchers')
                .select('amount')
                .eq('voucher_type', 'SALES')
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString());

            if (salesError) {
                logger.error('Error fetching sales:', salesError);
            }

            const todaySales = salesData?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

            // Get today's purchases
            const { data: purchaseData, error: purchaseError } = await supabase
                .from('vouchers')
                .select('amount')
                .eq('voucher_type', 'PURCHASE')
                .eq('company_id', companyId)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString());

            if (purchaseError) {
                logger.error('Error fetching purchases:', purchaseError);
            }

            const todayPurchases = purchaseData?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

            // Get total customers
            const { count: totalCustomers, error: customersError } = await supabase
                .from('customers')
                .select('*', { count: 'exact' })
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (customersError) {
                logger.error('Error fetching customers:', customersError);
            }

            // Get stock value
            const { data: stockData, error: stockError } = await supabase
                .from('stock_items')
                .select('current_quantity, purchase_price')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (stockError) {
                logger.error('Error fetching stock:', stockError);
            }

            const stockValue = stockData?.reduce((sum, item) => 
                sum + (item.current_quantity * item.purchase_price), 0
            ) || 0;

            // Get low stock items
            const { data: lowStockItems, error: lowStockError } = await supabase
                .from('stock_items')
                .select('*')
                .eq('company_id', companyId)
                .lt('current_quantity', supabase.raw('reorder_level'))
                .is('deleted_at', null)
                .limit(5);

            if (lowStockError) {
                logger.error('Error fetching low stock:', lowStockError);
            }

            // Get recent transactions
            const { data: recentTransactions, error: transactionsError } = await supabase
                .from('vouchers')
                .select(`
                    id,
                    voucher_number,
                    voucher_type,
                    amount,
                    date,
                    narration,
                    ledgers!inner(name)
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
                .limit(10);

            if (transactionsError) {
                logger.error('Error fetching transactions:', transactionsError);
            }

            // Format transactions
            const formattedTransactions = recentTransactions?.map(t => ({
                id: t.id,
                description: t.narration || `${t.voucher_type} - ${t.ledgers?.name || 'Unknown'}`,
                amount: t.amount || 0,
                type: t.voucher_type === 'SALES' || t.voucher_type === 'RECEIPT' ? 'CREDIT' : 'DEBIT',
                date: t.date || t.created_at,
                reference: t.voucher_number
            })) || [];

            // Get top customers
            const { data: topCustomers, error: topCustomersError } = await supabase
                .from('customers')
                .select('id, name, email, outstanding_balance')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('outstanding_balance', { ascending: false })
                .limit(5);

            if (topCustomersError) {
                logger.error('Error fetching top customers:', topCustomersError);
            }

            // Get monthly sales data (last 6 months)
            const monthlyData = await this.getMonthlySales(companyId);

            res.json({
                success: true,
                data: {
                    todaySales,
                    todayPurchases,
                    totalCustomers: totalCustomers || 0,
                    stockValue,
                    lowStockItems: lowStockItems || [],
                    recentTransactions: formattedTransactions,
                    topCustomers: topCustomers || [],
                    salesData: monthlyData,
                    // Additional stats
                    stats: {
                        receivables: 0,
                        payables: 0,
                        salesTrend: 0,
                        purchaseTrend: 0
                    }
                }
            });
        } catch (error) {
            logger.error('Dashboard overview error:', error);
            next(error);
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