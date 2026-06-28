const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class AccountGroupModel {
    async create(groupData, userId, companyId) {
        try {
            // Check if group already exists
            const { data: existing, error: existingError } = await supabase
                .from('account_groups')
                .select('id')
                .eq('name', groupData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Account group with this name already exists');
            }

            // Check if parent group exists
            if (groupData.parent_id) {
                const { data: parent, error: parentError } = await supabase
                    .from('account_groups')
                    .select('id')
                    .eq('id', groupData.parent_id)
                    .eq('company_id', companyId)
                    .single();

                if (parentError || !parent) {
                    throw new Error('Invalid parent group');
                }
            }

            const newGroup = {
                name: groupData.name,
                type: groupData.type,
                parent_id: groupData.parent_id || null,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('account_groups')
                .insert(newGroup)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Account group created: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error creating account group:', error);
            throw error;
        }
    }

    async findAll(companyId) {
        try {
            const { data, error } = await supabase
                .from('account_groups')
                .select(`
                    *,
                    parent:account_groups!parent_id (
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
            logger.error('Error finding account groups:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('account_groups')
                .select(`
                    *,
                    parent:account_groups!parent_id (
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
            logger.error('Error finding account group:', error);
            throw error;
        }
    }

    async update(id, companyId, groupData) {
        try {
            const { data, error } = await supabase
                .from('account_groups')
                .update(groupData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Account group updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating account group:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            // Check if group has ledgers
            const { count, error: countError } = await supabase
                .from('ledgers')
                .select('*', { count: 'exact' })
                .eq('group_id', id)
                .is('deleted_at', null);

            if (countError) throw countError;

            if (count > 0) {
                throw new Error('Cannot delete group with ledgers');
            }

            const { error } = await supabase
                .from('account_groups')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Account group deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting account group:', error);
            throw error;
        }
    }

    async getGroupTypes() {
        return [
            'ASSET',
            'LIABILITY',
            'INCOME',
            'EXPENSE',
            'EQUITY'
        ];
    }

    async getDefaultGroups(companyId) {
        const defaultGroups = [
            { name: 'Sundry Debtors', type: 'ASSET' },
            { name: 'Sundry Creditors', type: 'LIABILITY' },
            { name: 'Cash In Hand', type: 'ASSET' },
            { name: 'Bank Accounts', type: 'ASSET' },
            { name: 'Direct Income', type: 'INCOME' },
            { name: 'Direct Expenses', type: 'EXPENSE' },
            { name: 'Indirect Income', type: 'INCOME' },
            { name: 'Indirect Expenses', type: 'EXPENSE' },
            { name: 'Current Assets', type: 'ASSET' },
            { name: 'Fixed Assets', type: 'ASSET' },
            { name: 'Current Liabilities', type: 'LIABILITY' },
            { name: 'Capital Account', type: 'EQUITY' },
            { name: 'Reserves & Surplus', type: 'EQUITY' }
        ];

        for (const group of defaultGroups) {
            const { data: existing } = await supabase
                .from('account_groups')
                .select('id')
                .eq('name', group.name)
                .eq('company_id', companyId)
                .single();

            if (!existing) {
                await supabase
                    .from('account_groups')
                    .insert({
                        ...group,
                        company_id: companyId,
                        created_by: null
                    });
            }
        }

        return this.findAll(companyId);
    }
}

module.exports = new AccountGroupModel();