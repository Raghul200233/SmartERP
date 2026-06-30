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

            // Create customer
            const newCustomer = {
                name: customerData.name,
                mobile: customerData.mobile || null,
                company_id: companyId,
                created_by: userId
            };

            const { data: customer, error: customerError } = await supabase
                .from('customers')
                .insert(newCustomer)
                .select()
                .single();

            if (customerError) throw customerError;

            // ✅ Create corresponding ledger
            await this.createCustomerLedger(customer, userId, companyId);

            logger.info(`Customer created: ${customer.name}`);
            return customer;
        } catch (error) {
            logger.error('Error creating customer:', error);
            throw error;
        }
    }

    async createCustomerLedger(customer, userId, companyId) {
        try {
            // Check if ledger already exists
            const { data: existingLedger, error: checkError } = await supabase
                .from('ledgers')
                .select('id')
                .eq('name', customer.name)
                .eq('ledger_type', 'CUSTOMER')
                .eq('company_id', companyId)
                .single();

            if (existingLedger) {
                logger.info(`Ledger already exists for customer: ${customer.name}`);
                return;
            }

            // Find Sundry Debtors group
            let groupId;
            const { data: group, error: groupError } = await supabase
                .from('account_groups')
                .select('id')
                .eq('name', 'Sundry Debtors')
                .eq('company_id', companyId)
                .single();

            if (groupError || !group) {
                // Create group if it doesn't exist
                const { data: newGroup, error: createGroupError } = await supabase
                    .from('account_groups')
                    .insert({
                        name: 'Sundry Debtors',
                        type: 'ASSET',
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
                    name: customer.name,
                    ledger_type: 'CUSTOMER',
                    group_id: groupId,
                    company_id: companyId,
                    status: 'ACTIVE',
                    created_by: userId
                });

            if (ledgerError) throw ledgerError;
            
            logger.info(`Ledger created for customer: ${customer.name}`);
        } catch (error) {
            logger.error('Error creating customer ledger:', error);
            throw error;
        }
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('customers')
                .select('id, name, mobile, created_at')
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
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
                .select('id, name, mobile, created_at')
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
                .update({
                    name: customerData.name,
                    mobile: customerData.mobile || null
                })
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            // Update corresponding ledger
            const { error: ledgerError } = await supabase
                .from('ledgers')
                .update({ name: customerData.name })
                .eq('name', customerData.old_name || customerData.name)
                .eq('ledger_type', 'CUSTOMER')
                .eq('company_id', companyId);

            if (ledgerError) {
                logger.error('Error updating customer ledger:', ledgerError);
            }

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
                    deleted_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            // Soft delete corresponding ledger
            await supabase
                .from('ledgers')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    status: 'INACTIVE'
                })
                .eq('ledger_type', 'CUSTOMER')
                .eq('company_id', companyId)
                .eq('name', (await this.findById(id, companyId))?.name);

            logger.info(`Customer deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting customer:', error);
            throw error;
        }
    }

    async search(companyId, searchTerm) {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, mobile')
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