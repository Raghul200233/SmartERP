const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class StockItemModel {
    async create(itemData, userId, companyId) {
        try {
            // Check if SKU already exists
            if (itemData.sku) {
                const { data: existing, error: existingError } = await supabase
                    .from('stock_items')
                    .select('id')
                    .eq('sku', itemData.sku)
                    .eq('company_id', companyId)
                    .is('deleted_at', null)
                    .single();

                if (existing) {
                    throw new Error('SKU already exists');
                }
            }

            const newItem = {
                name: itemData.name,
                sku: itemData.sku || null,
                barcode: itemData.barcode || null,
                stock_group_id: itemData.stock_group_id || null,
                unit_id: itemData.unit_id || null,
                purchase_price: itemData.purchase_price || 0,
                selling_price: itemData.selling_price || 0,
                gst_percentage: itemData.gst_percentage || 0,
                opening_quantity: itemData.opening_quantity || 0,
                reorder_level: itemData.reorder_level || 0,
                current_quantity: itemData.opening_quantity || 0,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('stock_items')
                .insert(newItem)
                .select()
                .single();

            if (error) throw error;

            // If opening quantity exists, create inventory transaction
            if (itemData.opening_quantity > 0) {
                await this.createInventoryTransaction({
                    stock_item_id: data.id,
                    transaction_type: 'OPENING_STOCK',
                    quantity: itemData.opening_quantity,
                    rate: itemData.purchase_price || 0,
                    value: itemData.opening_quantity * (itemData.purchase_price || 0),
                    company_id: companyId,
                    created_by: userId
                });
            }

            logger.info(`Stock item created: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error creating stock item:', error);
            throw error;
        }
    }

    async createInventoryTransaction(data) {
        const { error } = await supabase
            .from('inventory_transactions')
            .insert(data);

        if (error) {
            logger.error('Error creating inventory transaction:', error);
            throw error;
        }
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
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
                .is('deleted_at', null);

            if (filters.stock_group_id) {
                query = query.eq('stock_group_id', filters.stock_group_id);
            }

            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding stock items:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
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
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding stock item:', error);
            throw error;
        }
    }

    async update(id, companyId, itemData) {
        try {
            // Check if SKU already exists (excluding current item)
            if (itemData.sku) {
                const { data: existing, error: existingError } = await supabase
                    .from('stock_items')
                    .select('id')
                    .eq('sku', itemData.sku)
                    .eq('company_id', companyId)
                    .neq('id', id)
                    .is('deleted_at', null)
                    .single();

                if (existing) {
                    throw new Error('SKU already exists');
                }
            }

            const { data, error } = await supabase
                .from('stock_items')
                .update(itemData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Stock item updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating stock item:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            // Check if item has inventory transactions
            const { count, error: countError } = await supabase
                .from('inventory_transactions')
                .select('*', { count: 'exact' })
                .eq('stock_item_id', id);

            if (countError) throw countError;

            if (count > 0) {
                throw new Error('Cannot delete item with inventory transactions');
            }

            const { error } = await supabase
                .from('stock_items')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    current_quantity: 0
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Stock item deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting stock item:', error);
            throw error;
        }
    }

    async getLowStockItems(companyId) {
        try {
            const { data, error } = await supabase
                .from('stock_items')
                .select(`
                    *,
                    stock_groups!inner (
                        name
                    ),
                    units!inner (
                        name,
                        symbol
                    )
                `)
                .eq('company_id', companyId)
                .lt('current_quantity', supabase.raw('reorder_level'))
                .is('deleted_at', null)
                .order('current_quantity', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error getting low stock items:', error);
            throw error;
        }
    }

    async getStockValue(companyId) {
        try {
            const { data, error } = await supabase
                .from('stock_items')
                .select('current_quantity, purchase_price')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (error) throw error;

            const totalValue = data.reduce((sum, item) => 
                sum + ((item.current_quantity || 0) * (item.purchase_price || 0)), 0
            );

            return totalValue;
        } catch (error) {
            logger.error('Error getting stock value:', error);
            throw error;
        }
    }

    async search(companyId, searchTerm, limit = 20) {
        try {
            const { data, error } = await supabase
                .from('stock_items')
                .select(`
                    *,
                    stock_groups!inner (
                        name
                    ),
                    units!inner (
                        name,
                        symbol
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`)
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error searching stock items:', error);
            throw error;
        }
    }

    async updateQuantity(id, companyId, quantity, transactionType, referenceId = null, referenceType = null) {
        try {
            // Get current item
            const { data: item, error: itemError } = await supabase
                .from('stock_items')
                .select('current_quantity, purchase_price')
                .eq('id', id)
                .eq('company_id', companyId)
                .single();

            if (itemError) throw itemError;

            // Calculate new quantity
            let newQuantity;
            if (transactionType === 'STOCK_IN') {
                newQuantity = (item.current_quantity || 0) + quantity;
            } else if (transactionType === 'STOCK_OUT') {
                if (item.current_quantity < quantity) {
                    throw new Error('Insufficient stock');
                }
                newQuantity = (item.current_quantity || 0) - quantity;
            } else {
                throw new Error('Invalid transaction type');
            }

            // Update item quantity
            const { error: updateError } = await supabase
                .from('stock_items')
                .update({ current_quantity: newQuantity })
                .eq('id', id)
                .eq('company_id', companyId);

            if (updateError) throw updateError;

            // Create inventory transaction
            await this.createInventoryTransaction({
                stock_item_id: id,
                transaction_type: transactionType,
                quantity: quantity,
                rate: item.purchase_price || 0,
                value: quantity * (item.purchase_price || 0),
                reference_id: referenceId,
                reference_type: referenceType,
                company_id: companyId,
                created_by: null // Will be set by controller
            });

            return { newQuantity };
        } catch (error) {
            logger.error('Error updating stock quantity:', error);
            throw error;
        }
    }
}

module.exports = new StockItemModel();