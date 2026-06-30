const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class VoucherModel {
    async create(voucherData, userId, companyId) {
        try {
            // Validate payment type
            const validPaymentTypes = ['CASH', 'CARD', 'UPI'];
            const paymentType = voucherData.payment_type || 'CASH';
            if (!validPaymentTypes.includes(paymentType)) {
                throw new Error('Invalid payment type. Use CASH, CARD, or UPI');
            }

            // Get or create ledger for customer/supplier
            let ledgerId = voucherData.ledger_id;
            if (voucherData.ledger_name && !ledgerId) {
                ledgerId = await this.getOrCreateLedger(
                    voucherData.ledger_name,
                    voucherData.ledger_type || 'CUSTOMER',
                    companyId,
                    userId
                );
            } else if (ledgerId) {
                // Validate ledger exists
                const { data: ledger, error } = await supabase
                    .from('ledgers')
                    .select('id')
                    .eq('id', ledgerId)
                    .eq('company_id', companyId)
                    .is('deleted_at', null)
                    .single();

                if (error || !ledger) {
                    ledgerId = await this.getOrCreateLedger(
                        voucherData.ledger_name || 'Walk-in Customer',
                        'CUSTOMER',
                        companyId,
                        userId
                    );
                }
            } else {
                // Default to Walk-in Customer
                ledgerId = await this.getOrCreateLedger(
                    'Walk-in Customer',
                    'CUSTOMER',
                    companyId,
                    userId
                );
            }

            // Calculate total amount from items
            let totalAmount = 0;
            let totalGst = 0;
            const items = voucherData.items || [];

            for (const item of items) {
                const quantity = parseFloat(item.quantity) || 0;
                const rate = parseFloat(item.rate) || 0;
                const gst = parseFloat(item.gst_percentage) || 0;
                const amount = quantity * rate;
                const gstAmount = (amount * gst) / 100;
                totalAmount += amount;
                totalGst += gstAmount;
            }

            const grandTotal = totalAmount + totalGst - (parseFloat(voucherData.discount) || 0);

            // Generate voucher number
            const voucherNumber = await this.generateVoucherNumber(voucherData.voucher_type, companyId);

            // Create voucher
            const voucher = {
                voucher_type: voucherData.voucher_type,
                voucher_number: voucherNumber,
                date: voucherData.date || new Date().toISOString().split('T')[0],
                ledger_id: ledgerId,
                company_id: companyId,
                amount: grandTotal,
                narration: voucherData.narration || null,
                reference_number: voucherData.reference_number || null,
                payment_type: paymentType,
                status: voucherData.status || 'POSTED',
                created_by: userId
            };

            const { data, error } = await supabase
                .from('vouchers')
                .insert(voucher)
                .select()
                .single();

            if (error) throw error;

            // Process inventory for Purchase/Sales
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

    async processInventory(voucherData, voucherId, userId, companyId) {
        try {
            if (!voucherData.items || voucherData.items.length === 0) {
                return;
            }

            const isPurchase = voucherData.voucher_type === 'PURCHASE';

            for (const item of voucherData.items) {
                const quantity = parseFloat(item.quantity) || 0;
                const rate = parseFloat(item.rate) || 0;
                const sellingPrice = parseFloat(item.selling_price) || rate;
                
                // Check if stock item exists
                const { data: stockItem, error: stockError } = await supabase
                    .from('stock_items')
                    .select('id, current_quantity, purchase_price')
                    .eq('id', item.stock_item_id)
                    .eq('company_id', companyId)
                    .single();

                if (stockError) {
                    throw new Error(`Stock item not found: ${item.stock_item_id}`);
                }

                const currentQty = stockItem.current_quantity || 0;
                let newQuantity;

                if (isPurchase) {
                    // Purchase: Increase stock
                    newQuantity = currentQty + quantity;
                    
                    // Update purchase price if it's a new purchase
                    await supabase
                        .from('stock_items')
                        .update({ 
                            current_quantity: newQuantity,
                            purchase_price: rate,
                            selling_price: sellingPrice || stockItem.selling_price
                        })
                        .eq('id', item.stock_item_id)
                        .eq('company_id', companyId);
                } else {
                    // Sales: Decrease stock
                    if (currentQty < quantity) {
                        throw new Error(`Insufficient stock for item. Available: ${currentQty}, Requested: ${quantity}`);
                    }
                    newQuantity = currentQty - quantity;
                    
                    await supabase
                        .from('stock_items')
                        .update({ current_quantity: newQuantity })
                        .eq('id', item.stock_item_id)
                        .eq('company_id', companyId);
                }

                // Create inventory transaction
                await supabase
                    .from('inventory_transactions')
                    .insert({
                        stock_item_id: item.stock_item_id,
                        transaction_type: isPurchase ? 'PURCHASE' : 'SALES',
                        quantity: quantity,
                        rate: isPurchase ? rate : sellingPrice,
                        value: quantity * (isPurchase ? rate : sellingPrice),
                        selling_price: isPurchase ? null : sellingPrice,
                        voucher_id: voucherId,
                        reference_type: voucherData.voucher_type,
                        reference_id: voucherId,
                        company_id: companyId,
                        created_by: userId
                    });
            }
        } catch (error) {
            logger.error('Error processing inventory:', error);
            throw error;
        }
    }

    async getOrCreateLedger(name, type, companyId, userId) {
        try {
            // Try to find existing ledger
            const { data: existing, error: findError } = await supabase
                .from('ledgers')
                .select('id')
                .eq('name', name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                return existing.id;
            }

            // Get default group
            const groupMap = {
                'CUSTOMER': 'Sundry Debtors',
                'SUPPLIER': 'Sundry Creditors'
            };
            const groupName = groupMap[type] || 'Sundry Debtors';
            
            const { data: group, error: groupError } = await supabase
                .from('account_groups')
                .select('id')
                .eq('name', groupName)
                .eq('company_id', companyId)
                .single();

            let groupId;
            if (groupError || !group) {
                const typeMap = { 'CUSTOMER': 'ASSET', 'SUPPLIER': 'LIABILITY' };
                const { data: newGroup, error: createGroupError } = await supabase
                    .from('account_groups')
                    .insert({
                        name: groupName,
                        type: typeMap[type] || 'ASSET',
                        company_id: companyId,
                        created_by: userId
                    })
                    .select()
                    .single();

                if (createGroupError) throw createGroupError;
                groupId = newGroup.id;
            } else {
                groupId = group.id;
            }

            // Create ledger
            const { data: newLedger, error: createError } = await supabase
                .from('ledgers')
                .insert({
                    name: name,
                    ledger_type: type,
                    group_id: groupId,
                    company_id: companyId,
                    status: 'ACTIVE',
                    opening_balance: 0,
                    created_by: userId
                })
                .select()
                .single();

            if (createError) throw createError;
            return newLedger.id;
        } catch (error) {
            logger.error('Error getting/creating ledger:', error);
            throw error;
        }
    }

    async generateVoucherNumber(voucherType, companyId) {
        const prefix = {
            'PURCHASE': 'PUR',
            'SALES': 'SAL'
        }[voucherType] || 'VCH';

        const { data, error } = await supabase
            .from('vouchers')
            .select('voucher_number')
            .eq('voucher_type', voucherType)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
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

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('Supabase error in findAll:', error);
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('Error finding vouchers:', error);
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

    async getStats(companyId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select('voucher_type, amount, payment_type')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const stats = {
                sales: { count: 0, amount: 0, cash: 0, card: 0, upi: 0 },
                purchases: { count: 0, amount: 0 }
            };

            for (const voucher of data) {
                if (voucher.voucher_type === 'SALES') {
                    stats.sales.count++;
                    stats.sales.amount += voucher.amount || 0;
                    if (voucher.payment_type === 'CASH') stats.sales.cash += voucher.amount || 0;
                    else if (voucher.payment_type === 'CARD') stats.sales.card += voucher.amount || 0;
                    else if (voucher.payment_type === 'UPI') stats.sales.upi += voucher.amount || 0;
                } else if (voucher.voucher_type === 'PURCHASE') {
                    stats.purchases.count++;
                    stats.purchases.amount += voucher.amount || 0;
                }
            }

            return stats;
        } catch (error) {
            logger.error('Error getting voucher stats:', error);
            throw error;
        }
    }

    async getVoucherTypes() {
        return ['PURCHASE', 'SALES'];
    }
}

module.exports = new VoucherModel();