const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class SupplierModel {
    async create(supplierData, userId, companyId) {
        try {
            // Check if supplier already exists
            const { data: existing, error: existingError } = await supabase
                .from('suppliers')
                .select('id')
                .eq('name', supplierData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Supplier with this name already exists');
            }

            // Create supplier
            const newSupplier = {
                name: supplierData.name,
                contact_number: supplierData.contact_number || null,
                address: supplierData.address || null,
                gst_number: supplierData.gst_number || null,
                company_id: companyId,
                created_by: userId
            };

            const { data: supplier, error: supplierError } = await supabase
                .from('suppliers')
                .insert(newSupplier)
                .select()
                .single();

            if (supplierError) throw supplierError;

            // ✅ Create corresponding ledger
            await this.createSupplierLedger(supplier, userId, companyId);

            logger.info(`Supplier created: ${supplier.name}`);
            return supplier;
        } catch (error) {
            logger.error('Error creating supplier:', error);
            throw error;
        }
    }

    async createSupplierLedger(supplier, userId, companyId) {
        try {
            // Check if ledger already exists
            const { data: existingLedger, error: checkError } = await supabase
                .from('ledgers')
                .select('id')
                .eq('name', supplier.name)
                .eq('ledger_type', 'SUPPLIER')
                .eq('company_id', companyId)
                .single();

            if (existingLedger) {
                logger.info(`Ledger already exists for supplier: ${supplier.name}`);
                return;
            }

            // Find Sundry Creditors group
            let groupId;
            const { data: group, error: groupError } = await supabase
                .from('account_groups')
                .select('id')
                .eq('name', 'Sundry Creditors')
                .eq('company_id', companyId)
                .single();

            if (groupError || !group) {
                // Create group if it doesn't exist
                const { data: newGroup, error: createGroupError } = await supabase
                    .from('account_groups')
                    .insert({
                        name: 'Sundry Creditors',
                        type: 'LIABILITY',
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
            const { error: ledgerError } = await supabase
                .from('ledgers')
                .insert({
                    name: supplier.name,
                    ledger_type: 'SUPPLIER',
                    group_id: groupId,
                    company_id: companyId,
                    opening_balance: 0,
                    status: 'ACTIVE',
                    created_by: userId
                });

            if (ledgerError) throw ledgerError;
            
            logger.info(`Ledger created for supplier: ${supplier.name}`);
        } catch (error) {
            logger.error('Error creating supplier ledger:', error);
            throw error;
        }
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('suppliers')
                .select('*')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding suppliers:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding supplier:', error);
            throw error;
        }
    }

    async update(id, companyId, supplierData) {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .update(supplierData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Supplier updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating supplier:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            const { error } = await supabase
                .from('suppliers')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    name: 'deleted_' + Date.now()
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Supplier deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting supplier:', error);
            throw error;
        }
    }

    async getPurchaseHistory(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('vouchers')
                .select(`
                    id,
                    voucher_number,
                    date,
                    amount,
                    narration
                `)
                .eq('ledger_id', id)
                .eq('voucher_type', 'PURCHASE')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error getting purchase history:', error);
            throw error;
        }
    }

    async search(companyId, searchTerm) {
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .ilike('name', `%${searchTerm}%`)
                .limit(20);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error searching suppliers:', error);
            throw error;
        }
    }
}

module.exports = new SupplierModel();