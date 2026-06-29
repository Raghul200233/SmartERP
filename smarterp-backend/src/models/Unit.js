const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class UnitModel {
    async create(unitData, userId, companyId) {
        try {
            // Check if unit already exists
            const { data: existing, error: existingError } = await supabase
                .from('units')
                .select('id')
                .eq('name', unitData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Unit with this name already exists');
            }

            const newUnit = {
                name: unitData.name,
                symbol: unitData.symbol,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('units')
                .insert(newUnit)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Unit created: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error creating unit:', error);
            throw error;
        }
    }

    async findAll(companyId) {
        try {
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding units:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding unit:', error);
            throw error;
        }
    }

    async update(id, companyId, unitData) {
        try {
            const { data, error } = await supabase
                .from('units')
                .update(unitData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Unit updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating unit:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            // Check if unit is used by stock items
            const { count, error: countError } = await supabase
                .from('stock_items')
                .select('*', { count: 'exact' })
                .eq('unit_id', id)
                .is('deleted_at', null);

            if (countError) throw countError;

            if (count > 0) {
                throw new Error('Cannot delete unit used by stock items');
            }

            const { error } = await supabase
                .from('units')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Unit deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting unit:', error);
            throw error;
        }
    }
}

module.exports = new UnitModel();