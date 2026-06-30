const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class ReportModel {
    async getBalanceSheet(companyId, asOnDate) {
        try {
            // Get all ledgers with their groups
            const { data: ledgers, error: ledgerError } = await supabase
                .from('ledgers')
                .select(`
                    *,
                    account_groups!inner (
                        id,
                        name,
                        type
                    )
                `)
                .eq('company_id', companyId)
                .eq('status', 'ACTIVE')
                .is('deleted_at', null);

            if (ledgerError) throw ledgerError;

            // Get all vouchers up to the date (without voucher_entries)
            const { data: vouchers, error: voucherError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('company_id', companyId)
                .lte('date', asOnDate)
                .is('deleted_at', null);

            if (voucherError) throw voucherError;

            // Calculate balances from vouchers
            const assetGroups = ['ASSET', 'CURRENT_ASSET', 'FIXED_ASSET'];
            const liabilityGroups = ['LIABILITY', 'CURRENT_LIABILITY'];
            
            let totalAssets = 0;
            let totalLiabilities = 0;
            let totalEquity = 0;
            
            const assetLedgers = [];
            const liabilityLedgers = [];
            const equityLedgers = [];

            for (const ledger of ledgers) {
                
                // For each voucher, if this ledger is involved, update balance
                for (const voucher of vouchers) {
                    if (voucher.ledger_id === ledger.id) {
                        // For simplicity, we treat sales as credit and purchases as debit
                        // In a real system, you'd need more sophisticated logic
                        if (voucher.voucher_type === 'SALES') {
                            balance += voucher.amount;
                        } else if (voucher.voucher_type === 'PURCHASE') {
                            balance -= voucher.amount;
                        }
                    }
                }

                const groupType = ledger.account_groups?.type || '';
                const ledgerData = {
                    name: ledger.name,
                    balance: Math.abs(balance),
                    type: balance >= 0 ? 'DEBIT' : 'CREDIT'
                };

                if (balance !== 0) {
                    if (assetGroups.includes(groupType)) {
                        assetLedgers.push(ledgerData);
                        totalAssets += Math.abs(balance);
                    } else if (liabilityGroups.includes(groupType)) {
                        liabilityLedgers.push(ledgerData);
                        totalLiabilities += Math.abs(balance);
                    } else {
                        equityLedgers.push(ledgerData);
                        totalEquity += Math.abs(balance);
                    }
                }
            }

            return {
                assets: {
                    total: totalAssets,
                    ledgers: assetLedgers
                },
                liabilities: {
                    total: totalLiabilities,
                    ledgers: liabilityLedgers
                },
                equity: {
                    total: totalEquity,
                    ledgers: equityLedgers
                },
                total: totalAssets,
                totalLiabilitiesEquity: totalLiabilities + totalEquity,
                isBalanced: totalAssets === (totalLiabilities + totalEquity)
            };
        } catch (error) {
            logger.error('Error getting balance sheet:', error);
            throw error;
        }
    }

    async getProfitLoss(companyId, startDate, endDate) {
        try {
            // Get income and expense ledgers
            const { data: ledgers, error: ledgerError } = await supabase
                .from('ledgers')
                .select(`
                    *,
                    account_groups!inner (
                        id,
                        name,
                        type
                    )
                `)
                .eq('company_id', companyId)
                .eq('status', 'ACTIVE')
                .in('account_groups.type', ['INCOME', 'EXPENSE'])
                .is('deleted_at', null);

            if (ledgerError) throw ledgerError;

            // Get vouchers for the period
            const { data: vouchers, error: voucherError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('company_id', companyId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null);

            if (voucherError) throw voucherError;

            let totalIncome = 0;
            let totalExpenses = 0;
            const incomeLedgers = [];
            const expenseLedgers = [];

            for (const ledger of ledgers) {
                let balance = 0;

                for (const voucher of vouchers) {
                    if (voucher.ledger_id === ledger.id) {
                        // Sales = Income, Purchases = Expense
                        if (voucher.voucher_type === 'SALES') {
                            balance += voucher.amount;
                        } else if (voucher.voucher_type === 'PURCHASE') {
                            balance -= voucher.amount;
                        }
                    }
                }

                if (balance !== 0) {
                    const ledgerData = {
                        name: ledger.name,
                        amount: Math.abs(balance)
                    };

                    if (ledger.account_groups?.type === 'INCOME') {
                        incomeLedgers.push(ledgerData);
                        totalIncome += Math.abs(balance);
                    } else {
                        expenseLedgers.push(ledgerData);
                        totalExpenses += Math.abs(balance);
                    }
                }
            }

            const netProfit = totalIncome - totalExpenses;

            return {
                income: {
                    total: totalIncome,
                    ledgers: incomeLedgers
                },
                expenses: {
                    total: totalExpenses,
                    ledgers: expenseLedgers
                },
                netProfit,
                isProfit: netProfit > 0
            };
        } catch (error) {
            logger.error('Error getting profit & loss:', error);
            throw error;
        }
    }

    async getTrialBalance(companyId, asOnDate) {
        try {
            // Get all ledgers
            const { data: ledgers, error: ledgerError } = await supabase
                .from('ledgers')
                .select('*')
                .eq('company_id', companyId)
                .eq('status', 'ACTIVE')
                .is('deleted_at', null);

            if (ledgerError) throw ledgerError;

            // Get vouchers
            const { data: vouchers, error: voucherError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('company_id', companyId)
                .lte('date', asOnDate)
                .is('deleted_at', null);

            if (voucherError) throw voucherError;

            const trialBalance = [];
            let totalDebit = 0;
            let totalCredit = 0;

            for (const ledger of ledgers) {
                let debit = 0;
                let credit = 0;

                // Voucher transactions
                for (const voucher of vouchers) {
                    if (voucher.ledger_id === ledger.id) {
                        if (voucher.voucher_type === 'SALES') {
                            credit += voucher.amount;
                        } else if (voucher.voucher_type === 'PURCHASE') {
                            debit += voucher.amount;
                        }
                    }
                }

                const netDebit = debit - credit;
                const netCredit = credit - debit;

                if (netDebit !== 0 || netCredit !== 0) {
                    trialBalance.push({
                        ledger: ledger.name,
                        debit: netDebit > 0 ? netDebit : 0,
                        credit: netCredit > 0 ? netCredit : 0
                    });

                    totalDebit += netDebit > 0 ? netDebit : 0;
                    totalCredit += netCredit > 0 ? netCredit : 0;
                }
            }

            return {
                trialBalance,
                totals: {
                    debit: totalDebit,
                    credit: totalCredit
                },
                isBalanced: totalDebit === totalCredit
            };
        } catch (error) {
            logger.error('Error getting trial balance:', error);
            throw error;
        }
    }

    async getStockSummary(companyId) {
        try {
            const { data: items, error } = await supabase
                .from('stock_items')
                .select(`
                    *,
                    stock_groups!inner (
                        id,
                        name
                    ),
                    units!inner (
                        id,
                        name,
                        symbol
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;

            let totalValue = 0;
            let totalQuantity = 0;
            const summary = items.map(item => {
                const value = (item.current_quantity || 0) * (item.purchase_price || 0);
                totalValue += value;
                totalQuantity += item.current_quantity || 0;
                
                return {
                    ...item,
                    stock_value: value
                };
            });

            return {
                items: summary,
                summary: {
                    total_items: items.length,
                    total_quantity: totalQuantity,
                    total_value: totalValue
                }
            };
        } catch (error) {
            logger.error('Error getting stock summary:', error);
            throw error;
        }
    }

    async getGSTReport(companyId, startDate, endDate) {
        try {
            // Get sales vouchers with GST
            const { data: sales, error: salesError } = await supabase
                .from('vouchers')
                .select(`
                    *,
                    voucher_entries (
                        amount,
                        entry_type
                    )
                `)
                .eq('voucher_type', 'SALES')
                .eq('company_id', companyId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null);

            if (salesError) throw salesError;

            // Get purchase vouchers with GST
            const { data: purchases, error: purchaseError } = await supabase
                .from('vouchers')
                .select(`
                    *,
                    voucher_entries (
                        amount,
                        entry_type
                    )
                `)
                .eq('voucher_type', 'PURCHASE')
                .eq('company_id', companyId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null);

            if (purchaseError) throw purchaseError;

            // Calculate GST amounts (assuming GST is embedded in the total)
            // For simplicity, we'll use a placeholder calculation
            const totalSales = sales.reduce((sum, v) => sum + (v.amount || 0), 0);
            const totalPurchases = purchases.reduce((sum, v) => sum + (v.amount || 0), 0);
            
            // Assuming 18% GST rate for calculation (this should come from items)
            const gstRate = 0.18;
            const gstOnSales = totalSales * (gstRate / (1 + gstRate));
            const gstOnPurchases = totalPurchases * (gstRate / (1 + gstRate));
            const netGST = gstOnSales - gstOnPurchases;

            return {
                period: { startDate, endDate },
                sales: {
                    count: sales.length,
                    total_amount: totalSales,
                    gst_amount: gstOnSales
                },
                purchases: {
                    count: purchases.length,
                    total_amount: totalPurchases,
                    gst_amount: gstOnPurchases
                },
                net_gst: netGST,
                isPayable: netGST > 0
            };
        } catch (error) {
            logger.error('Error getting GST report:', error);
            throw error;
        }
    }

    async getSalesReport(companyId, startDate, endDate) {
        try {
            const { data: sales, error } = await supabase
                .from('vouchers')
                .select(`
                    *,
                    ledgers!inner (
                        id,
                        name
                    )
                `)
                .eq('voucher_type', 'SALES')
                .eq('company_id', companyId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;

            const totalAmount = sales.reduce((sum, v) => sum + (v.amount || 0), 0);

            return {
                sales,
                summary: {
                    total_sales: sales.length,
                    total_amount: totalAmount,
                    average: sales.length > 0 ? totalAmount / sales.length : 0
                }
            };
        } catch (error) {
            logger.error('Error getting sales report:', error);
            throw error;
        }
    }

    async getPurchaseReport(companyId, startDate, endDate) {
        try {
            const { data: purchases, error } = await supabase
                .from('vouchers')
                .select(`
                    *,
                    ledgers!inner (
                        id,
                        name
                    )
                `)
                .eq('voucher_type', 'PURCHASE')
                .eq('company_id', companyId)
                .gte('date', startDate)
                .lte('date', endDate)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;

            const totalAmount = purchases.reduce((sum, v) => sum + (v.amount || 0), 0);

            return {
                purchases,
                summary: {
                    total_purchases: purchases.length,
                    total_amount: totalAmount,
                    average: purchases.length > 0 ? totalAmount / purchases.length : 0
                }
            };
        } catch (error) {
            logger.error('Error getting purchase report:', error);
            throw error;
        }
    }
}

module.exports = new ReportModel();