const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class CustomerModel {
    async create(customerData, userId, companyId) {
        try {
            // Check if customer already exists
            const { data: existing, error: existingError } = await supabase
                .from('customers')
                .select('id')
                .eq('name', customerData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Customer with this name already exists');
            }

            const newCustomer = {
                name: customerData.name,
                mobile: customerData.mobile || null,
                address: customerData.address || null,
                gst_number: customerData.gst_number || null,
                email: customerData.email || null,
                outstanding_balance: customerData.outstanding_balance || 0,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('customers')
                .insert(newCustomer)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Customer created: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error creating customer:', error);
            throw error;
        }
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('customers')
                .select('*')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }

            if (filters.has_outstanding) {
                query = query.gt('outstanding_balance', 0);
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding customers:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding customer:', error);
            throw error;
        }
    }

    async update(id, companyId, customerData) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .update(customerData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Customer updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating customer:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            const { error } = await supabase
                .from('customers')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    name: 'deleted_' + Date.now() // Make name unique
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Customer deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting customer:', error);
            throw error;
        }
    }

    async getLedger(id, companyId, startDate, endDate) {
        try {
            // Get all transactions for this customer
            let query = supabase
                .from('vouchers')
                .select(`
                    id,
                    voucher_number,
                    voucher_type,
                    date,
                    amount,
                    narration,
                    voucher_entries!inner (
                        amount,
                        entry_type
                    )
                `)
                .eq('ledger_id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (startDate) {
                query = query.gte('date', startDate);
            }

            if (endDate) {
                query = query.lte('date', endDate);
            }

            query = query.order('date', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            // Format ledger entries
            const ledger = data.map(voucher => {
                let debit = 0;
                let credit = 0;
                
                for (const entry of voucher.voucher_entries) {
                    if (entry.entry_type === 'DEBIT') {
                        debit += entry.amount;
                    } else {
                        credit += entry.amount;
                    }
                }

                return {
                    date: voucher.date,
                    voucher_number: voucher.voucher_number,
                    voucher_type: voucher.voucher_type,
                    narration: voucher.narration,
                    debit,
                    credit,
                    balance: debit - credit
                };
            });

            return ledger;
        } catch (error) {
            logger.error('Error getting customer ledger:', error);
            throw error;
        }
    }

    async search(companyId, searchTerm) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .ilike('name', `%${searchTerm}%`)
                .limit(20);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error searching customers:', error);
            throw error;
        }
    }
}

module.exports = new CustomerModel();