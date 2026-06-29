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