const { supabase, pool, transaction } = require('../config/database');
const logger = require('../utils/logger');

class CompanyModel {
    async create(companyData, userId) {
        try {
            // Start a transaction
            return await transaction(async () => {
                // Create company
                const company = {
                    ...companyData,
                    created_by: userId
                };

                const { data: company, error: companyError } = await supabase
                    .from('companies')
                    .insert(company)
                    .select()
                    .single();

                if (companyError) throw companyError;

                // Create user-company relationship
                const { error: relationError } = await supabase
                    .from('user_companies')
                    .insert({
                        user_id: userId,
                        company_id: company.id,
                        role: 'ADMIN',
                        is_default: true
                    });

                if (relationError) throw relationError;

                // Create default account groups
                await this.createDefaultAccountGroups(company.id, userId);
                
                // Create default stock groups
                await this.createDefaultStockGroups(company.id, userId);
                
                // Create default units
                await this.createDefaultUnits(company.id, userId);
                
                // Create default ledgers
                await this.createDefaultLedgers(company.id, userId);

                logger.info(`Company created: ${company.name} by user ${userId}`);
                return company;
            });
        } catch (error) {
            logger.error('Error creating company:', error);
            throw error;
        }
    }

    async createDefaultAccountGroups(companyId, userId) {
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
            { name: 'Capital Account', type: 'EQUITY' }
        ];

        for (const group of defaultGroups) {
            const { error } = await supabase
                .from('account_groups')
                .insert({
                    ...group,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) throw error;
        }
    }

    async createDefaultStockGroups(companyId, userId) {
        const defaultGroups = [
            'Electronics',
            'Furniture',
            'Groceries',
            'Medical',
            'Clothing',
            'Books & Stationery'
        ];

        for (const name of defaultGroups) {
            const { error } = await supabase
                .from('stock_groups')
                .insert({
                    name,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) throw error;
        }
    }

    async createDefaultUnits(companyId, userId) {
        const defaultUnits = [
            { name: 'Pieces', symbol: 'PCS' },
            { name: 'Kilogram', symbol: 'KG' },
            { name: 'Box', symbol: 'BOX' },
            { name: 'Liter', symbol: 'LTR' },
            { name: 'Meter', symbol: 'M' },
            { name: 'Square Feet', symbol: 'SQFT' }
        ];

        for (const unit of defaultUnits) {
            const { error } = await supabase
                .from('units')
                .insert({
                    ...unit,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) throw error;
        }
    }

    async createDefaultLedgers(companyId, userId) {
        // Get default account groups
        const { data: groups, error: groupsError } = await supabase
            .from('account_groups')
            .select('id, name')
            .eq('company_id', companyId);

        if (groupsError) throw groupsError;

        const groupMap = {};
        groups.forEach(g => groupMap[g.name] = g.id);

        const defaultLedgers = [
            { name: 'Cash', group: 'Cash In Hand', type: 'CASH', opening_balance: 0 },
            { name: 'Bank', group: 'Bank Accounts', type: 'BANK', opening_balance: 0 },
            { name: 'Capital', group: 'Capital Account', type: 'CAPITAL', opening_balance: 0 },
            { name: 'Sales', group: 'Direct Income', type: 'INCOME' },
            { name: 'Purchases', group: 'Direct Expenses', type: 'EXPENSE' }
        ];

        for (const ledger of defaultLedgers) {
            const { error } = await supabase
                .from('ledgers')
                .insert({
                    name: ledger.name,
                    ledger_type: ledger.type,
                    group_id: groupMap[ledger.group],
                    company_id: companyId,
                    opening_balance: ledger.opening_balance || 0,
                    status: 'ACTIVE',
                    created_by: userId
                });

            if (error) throw error;
        }
    }

    async findAll(userId) {
        try {
            const { data, error } = await supabase
                .from('user_companies')
                .select(`
                    role,
                    is_default,
                    companies (
                        id,
                        name,
                        address,
                        gst_number,
                        financial_year,
                        state,
                        mobile,
                        email,
                        contact_person,
                        logo_url,
                        created_at,
                        updated_at
                    )
                `)
                .eq('user_id', userId);

            if (error) throw error;
            return data.map(item => ({
                ...item.companies,
                role: item.role,
                is_default: item.is_default
            }));
        } catch (error) {
            logger.error('Error finding companies:', error);
            throw error;
        }
    }

    async findById(companyId, userId) {
        try {
            // Check access
            const { data: access, error: accessError } = await supabase
                .from('user_companies')
                .select('role')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (accessError) throw accessError;

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return { ...data, role: access.role };
        } catch (error) {
            logger.error('Error finding company:', error);
            throw error;
        }
    }

    async update(companyId, userId, companyData) {
        try {
            // Check admin access
            const { data: access, error: accessError } = await supabase
                .from('user_companies')
                .select('role')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (accessError || access.role !== 'ADMIN') {
                throw new Error('Unauthorized: Admin access required');
            }

            const { data, error } = await supabase
                .from('companies')
                .update(companyData)
                .eq('id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Company updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating company:', error);
            throw error;
        }
    }

    async softDelete(companyId, userId) {
        try {
            // Check admin access
            const { data: access, error: accessError } = await supabase
                .from('user_companies')
                .select('role')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (accessError || access.role !== 'ADMIN') {
                throw new Error('Unauthorized: Admin access required');
            }

            const { error } = await supabase
                .from('companies')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', companyId);

            if (error) throw error;

            // Remove user associations
            await supabase
                .from('user_companies')
                .delete()
                .eq('company_id', companyId);

            logger.info(`Company soft deleted: ${companyId} by user ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting company:', error);
            throw error;
        }
    }

    async setDefaultCompany(userId, companyId) {
        try {
            // Reset all defaults
            await supabase
                .from('user_companies')
                .update({ is_default: false })
                .eq('user_id', userId);

            // Set new default
            const { error } = await supabase
                .from('user_companies')
                .update({ is_default: true })
                .eq('user_id', userId)
                .eq('company_id', companyId);

            if (error) throw error;
            return true;
        } catch (error) {
            logger.error('Error setting default company:', error);
            throw error;
        }
    }

    async getDefaultCompany(userId) {
        try {
            const { data, error } = await supabase
                .from('user_companies')
                .select(`
                    companies (*)
                `)
                .eq('user_id', userId)
                .eq('is_default', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data?.companies || null;
        } catch (error) {
            logger.error('Error getting default company:', error);
            throw error;
        }
    }

    async getCompanyStats(companyId) {
        try {
            // Get counts from various tables
            const [
                { count: ledgersCount },
                { count: customersCount },
                { count: suppliersCount },
                { count: stockItemsCount },
                { count: invoicesCount }
            ] = await Promise.all([
                supabase.from('ledgers').select('*', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('customers').select('*', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('suppliers').select('*', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('stock_items').select('*', { count: 'exact' }).eq('company_id', companyId),
                supabase.from('invoices').select('*', { count: 'exact' }).eq('company_id', companyId)
            ]);

            return {
                ledgers: ledgersCount || 0,
                customers: customersCount || 0,
                suppliers: suppliersCount || 0,
                stockItems: stockItemsCount || 0,
                invoices: invoicesCount || 0
            };
        } catch (error) {
            logger.error('Error getting company stats:', error);
            throw error;
        }
    }
}

module.exports = new CompanyModel();