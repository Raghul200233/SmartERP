const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class StockGroupModel {
    async create(groupData, userId, companyId) {
        try {
            // Check if group already exists
            const { data: existing, error: existingError } = await supabase
                .from('stock_groups')
                .select('id')
                .eq('name', groupData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Stock group with this name already exists');
            }

            const newGroup = {
                name: groupData.name,
                parent_id: groupData.parent_id || null,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('stock_groups')
                .insert(newGroup)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Stock group created: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error creating stock group:', error);
            throw error;
        }
    }

    async findAll(companyId) {
        try {
            const { data, error } = await supabase
                .from('stock_groups')
                .select(`
                    *,
                    parent:stock_groups!parent_id (
                        id,
                        name
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding stock groups:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('stock_groups')
                .select(`
                    *,
                    parent:stock_groups!parent_id (
                        id,
                        name
                    )
                `)
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding stock group:', error);
            throw error;
        }
    }

    async update(id, companyId, groupData) {
        try {
            const { data, error } = await supabase
                .from('stock_groups')
                .update(groupData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Stock group updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating stock group:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            // Check if group has stock items
            const { count, error: countError } = await supabase
                .from('stock_items')
                .select('*', { count: 'exact' })
                .eq('stock_group_id', id)
                .is('deleted_at', null);

            if (countError) throw countError;

            if (count > 0) {
                throw new Error('Cannot delete group with stock items');
            }

            const { error } = await supabase
                .from('stock_groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Stock group deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting stock group:', error);
            throw error;
        }
    }
}

module.exports = new StockGroupModel();