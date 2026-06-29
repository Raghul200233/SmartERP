const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class VoucherModel {
    async create(voucherData, userId, companyId) {
        try {
            // Generate voucher number
            const voucherNumber = await this.generateVoucherNumber(voucherData.voucher_type, companyId);

            // Create voucher
            const voucher = {
                voucher_type: voucherData.voucher_type,
                voucher_number: voucherNumber,
                date: voucherData.date || new Date().toISOString().split('T')[0],
                ledger_id: voucherData.ledger_id || null,
                company_id: companyId,
                amount: voucherData.amount || 0,
                narration: voucherData.narration || null,
                reference_number: voucherData.reference_number || null,
                status: voucherData.status || 'DRAFT',
                created_by: userId
            };

            const { data, error } = await supabase
                .from('vouchers')
                .insert(voucher)
                .select()
                .single();

            if (error) throw error;

            // Create voucher entries (Double entry)
            if (voucherData.entries && voucherData.entries.length > 0) {
                for (const entry of voucherData.entries) {
                    await this.createEntry({
                        voucher_id: data.id,
                        ledger_id: entry.ledger_id,
                        amount: entry.amount,
                        entry_type: entry.entry_type
                    });
                }
            }

            // Handle inventory for Purchase/Sales
            if (voucherData.voucher_type === 'PURCHASE' || voucherData.voucher_type === 'SALES') {
                await this.processInventory(voucherData, data.id, userId, companyId);
            }

            logger.info(`Voucher created: ${voucherNumber} (${voucherData.voucher_type})`);
            return data;
        } catch (error) {
            logger.error('Error creating voucher:', error);
            throw error;
        }
    }

    async createEntry(entryData) {
        const { error } = await supabase
            .from('voucher_entries')
            .insert(entryData);

        if (error) {
            logger.error('Error creating voucher entry:', error);
            throw error;
        }
    }

async processInventory(voucherData, voucherId, userId, companyId) {
    try {
        if (!voucherData.items || voucherData.items.length === 0) {
            return;
        }

        const isPurchase = voucherData.voucher_type === 'PURCHASE';

        for (const item of voucherData.items) {
            const quantity = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            
            // Check if stock item exists
            const { data: stockItem, error: stockError } = await supabase
                .from('stock_items')
                .select('id, current_quantity, purchase_price')
                .eq('id', item.stock_item_id)
                .eq('company_id', companyId)
                .single();

            if (stockError) {
                console.error('Stock item error:', stockError);
                throw new Error(`Stock item not found: ${item.stock_item_id}`);
            }

            const currentQty = stockItem.current_quantity || 0;
            const newQuantity = isPurchase 
                ? currentQty + quantity
                : currentQty - quantity;

            if (!isPurchase && newQuantity < 0) {
                throw new Error(`Insufficient stock for item. Available: ${currentQty}, Requested: ${quantity}`);
            }

            // Update stock quantity
            const { error: updateError } = await supabase
                .from('stock_items')
                .update({ current_quantity: newQuantity })
                .eq('id', item.stock_item_id)
                .eq('company_id', companyId);

            if (updateError) {
                console.error('Update stock error:', updateError);
                throw new Error('Failed to update stock quantity');
            }

            // Create inventory transaction with voucher_id
            const transactionData = {
                stock_item_id: item.stock_item_id,
                transaction_type: isPurchase ? 'PURCHASE' : 'SALES',
                quantity: quantity,
                rate: rate,
                value: quantity * rate,
                voucher_id: voucherId,  // Link to voucher
                reference_type: voucherData.voucher_type,
                reference_id: voucherId,
                company_id: companyId,
                created_by: userId
            };

            const { error: txError } = await supabase
                .from('inventory_transactions')
                .insert(transactionData);

            if (txError) {
                console.error('Transaction error:', txError);
                // Rollback stock update
                await supabase
                    .from('stock_items')
                    .update({ current_quantity: currentQty })
                    .eq('id', item.stock_item_id)
                    .eq('company_id', companyId);
                throw new Error('Failed to create inventory transaction');
            }
        }
    } catch (error) {
        console.error('Error processing inventory:', error);
        throw error;
    }
}

    async generateVoucherNumber(voucherType, companyId) {
        const prefix = {
            'PURCHASE': 'PUR',
            'SALES': 'SAL',
            'CONTRA': 'CON',
            'JOURNAL': 'JRN',
            'CREDIT_NOTE': 'CRN',
            'DEBIT_NOTE': 'DRN'
        }[voucherType] || 'VCH';

        const { data, error } = await supabase
            .from('vouchers')
            .select('voucher_number')
            .eq('voucher_type', voucherType)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            logger.error('Error generating voucher number:', error);
            return `${prefix}-000001`;
        }

        let lastNumber = 0;
        if (data && data.length > 0) {
            const parts = data[0].voucher_number.split('-');
            lastNumber = parseInt(parts[parts.length - 1]) || 0;
        }

        const newNumber = lastNumber + 1;
        return `${prefix}-${String(newNumber).padStart(6, '0')}`;
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('vouchers')
                .select(`
                    *,
                    ledgers!inner (
                        id,
                        name,
                        ledger_type
                    ),
                    voucher_entries (
                        id,
                        ledger_id,
                        amount,
                        entry_type,
                        ledgers!inner (
                            id,
                            name,
                            ledger_type
                        )
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (filters.voucher_type) {
                query = query.eq('voucher_type', filters.voucher_type);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.start_date) {
                query = query.gte('date', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('date', filters.end_date);
            }

            if (filters.search) {
                query = query.ilike('voucher_number', `%${filters.search}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding vouchers:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select(`
                    *,
                    ledgers!inner (
                        id,
                        name,
                        ledger_type
                    ),
                    voucher_entries (
                        id,
                        ledger_id,
                        amount,
                        entry_type,
                        ledgers!inner (
                            id,
                            name,
                            ledger_type
                        )
                    ),
                    inventory_transactions (
                        *,
                        stock_items!inner (
                            id,
                            name,
                            sku
                        )
                    )
                `)
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding voucher:', error);
            throw error;
        }
    }

    async update(id, companyId, voucherData) {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .update({
                    date: voucherData.date,
                    ledger_id: voucherData.ledger_id,
                    amount: voucherData.amount,
                    narration: voucherData.narration,
                    reference_number: voucherData.reference_number,
                    status: voucherData.status
                })
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            // Update entries if provided
            if (voucherData.entries) {
                await supabase
                    .from('voucher_entries')
                    .delete()
                    .eq('voucher_id', id);

                for (const entry of voucherData.entries) {
                    await this.createEntry({
                        voucher_id: id,
                        ledger_id: entry.ledger_id,
                        amount: entry.amount,
                        entry_type: entry.entry_type
                    });
                }
            }

            logger.info(`Voucher updated: ${data.voucher_number}`);
            return data;
        } catch (error) {
            logger.error('Error updating voucher:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            const { error } = await supabase
                .from('vouchers')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    status: 'CANCELLED'
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Voucher deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting voucher:', error);
            throw error;
        }
    }

    async getVoucherTypes() {
        return ['PURCHASE', 'SALES', 'CONTRA', 'JOURNAL', 'CREDIT_NOTE', 'DEBIT_NOTE'];
    }

    async getStats(companyId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select('voucher_type, amount')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const stats = {};
            let totalAmount = 0;

            for (const voucher of data) {
                stats[voucher.voucher_type] = (stats[voucher.voucher_type] || 0) + voucher.amount;
                totalAmount += voucher.amount;
            }

            return {
                stats,
                totalAmount,
                count: data.length
            };
        } catch (error) {
            logger.error('Error getting voucher stats:', error);
            throw error;
        }
    }
}

module.exports = new VoucherModel();