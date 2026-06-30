const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class CompanyModel {
    async create(companyData, userId) {
        try {
            // Check if user already has 5 companies
            const { count, error: countError } = await supabase
                .from('user_companies')
                .select('*', { count: 'exact' })
                .eq('user_id', userId);

            if (countError) throw countError;

            if (count >= 5) {
                throw new Error('Maximum 5 companies allowed per user');
            }

            // Check if company name already exists for this user
            const { data: existing, error: existingError } = await supabase
                .from('companies')
                .select('id')
                .eq('name', companyData.name)
                .eq('created_by', userId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Company with this name already exists');
            }

            // Create company
            const newCompany = {
                ...companyData,
                created_by: userId,
                financial_year: companyData.financial_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
            };

            const { data: createdCompany, error: companyError } = await supabase
                .from('companies')
                .insert(newCompany)
                .select()
                .single();

            if (companyError) throw companyError;

            // Create user-company relationship
            const { error: relationError } = await supabase
                .from('user_companies')
                .insert({
                    user_id: userId,
                    company_id: createdCompany.id,
                    role: 'ADMIN',
                    is_default: true
                });

            if (relationError) throw relationError;

            // Create default data for the company
            await this.createDefaultData(createdCompany.id, userId);

            logger.info(`Company created: ${createdCompany.name} by user ${userId}`);
            return createdCompany;
        } catch (error) {
            logger.error('Error creating company:', error);
            throw error;
        }
    }

    async createDefaultData(companyId, userId) {
        try {
            // Create default account groups
            await this.createDefaultAccountGroups(companyId, userId);
            
            // Create default stock groups
            await this.createDefaultStockGroups(companyId, userId);
            
            // Create default units
            await this.createDefaultUnits(companyId, userId);
            
            // Create default ledgers
            await this.createDefaultLedgers(companyId, userId);
            
            // Create default customers
            await this.createDefaultCustomers(companyId, userId);
            
            // Create default suppliers
            await this.createDefaultSuppliers(companyId, userId);

            logger.info(`Default data created for company ${companyId}`);
        } catch (error) {
            logger.error('Error creating default data:', error);
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
            { name: 'Capital Account', type: 'EQUITY' },
            { name: 'Reserves & Surplus', type: 'EQUITY' },
            { name: 'Sales Accounts', type: 'INCOME' },
            { name: 'Purchase Accounts', type: 'EXPENSE' }
        ];

        for (const group of defaultGroups) {
            const { error } = await supabase
                .from('account_groups')
                .insert({
                    ...group,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default account group:', error);
                throw error;
            }
        }
    }

    async createDefaultStockGroups(companyId, userId) {
        const defaultGroups = [
            'Electronics',
            'Furniture',
            'Groceries',
            'Medical',
            'Clothing',
            'Books & Stationery',
            'Raw Materials',
            'Finished Goods',
            'Packaging Materials'
        ];

        for (const name of defaultGroups) {
            const { error } = await supabase
                .from('stock_groups')
                .insert({
                    name,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default stock group:', error);
                throw error;
            }
        }
    }

    async createDefaultUnits(companyId, userId) {
        const defaultUnits = [
            { name: 'Pieces', symbol: 'PCS' },
            { name: 'Kilogram', symbol: 'KG' },
            { name: 'Box', symbol: 'BOX' },
            { name: 'Liter', symbol: 'LTR' },
            { name: 'Meter', symbol: 'M' },
            { name: 'Square Feet', symbol: 'SQFT' },
            { name: 'Grams', symbol: 'G' },
            { name: 'Milliliter', symbol: 'ML' },
            { name: 'Dozen', symbol: 'DOZ' }
        ];

        for (const unit of defaultUnits) {
            const { error } = await supabase
                .from('units')
                .insert({
                    ...unit,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default unit:', error);
                throw error;
            }
        }
    }

    async createDefaultLedgers(companyId, userId) {
        // Get default account groups
        const { data: groups, error: groupsError } = await supabase
            .from('account_groups')
            .select('id, name')
            .eq('company_id', companyId);

        if (groupsError) {
            logger.error('Error fetching account groups:', groupsError);
            throw groupsError;
        }

        const groupMap = {};
        groups.forEach(g => groupMap[g.name] = g.id);

        const defaultLedgers = [
            { name: 'Cash', group: 'Cash In Hand', type: 'CASH'},
            { name: 'Bank Account', group: 'Bank Accounts', type: 'BANK'},
            { name: 'Capital Account', group: 'Capital Account', type: 'CAPITAL' },
            { name: 'Sales', group: 'Direct Income', type: 'INCOME' },
            { name: 'Purchases', group: 'Direct Expenses', type: 'EXPENSE'},
            { name: 'Salary', group: 'Indirect Expenses', type: 'EXPENSE' },
            { name: 'Rent', group: 'Indirect Expenses', type: 'EXPENSE' },
            { name: 'Electricity', group: 'Indirect Expenses', type: 'EXPENSE' },
            { name: 'Telephone', group: 'Indirect Expenses', type: 'EXPENSE'},
            { name: 'Travel', group: 'Indirect Expenses', type: 'EXPENSE' },
            { name: 'Office Expenses', group: 'Indirect Expenses', type: 'EXPENSE' }
        ];

        for (const ledger of defaultLedgers) {
            const { error } = await supabase
                .from('ledgers')
                .insert({
                    name: ledger.name,
                    ledger_type: ledger.type,
                    group_id: groupMap[ledger.group],
                    company_id: companyId,
                    status: 'ACTIVE',
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default ledger:', error);
                throw error;
            }
        }
    }

    async createDefaultCustomers(companyId, userId) {
        const defaultCustomers = [
            { name: 'Walk-in Customer', mobile: '9999999999', address: 'Default Address' }
        ];

        for (const customer of defaultCustomers) {
            const { error } = await supabase
                .from('customers')
                .insert({
                    ...customer,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default customer:', error);
                throw error;
            }
        }
    }

    async createDefaultSuppliers(companyId, userId) {
        const defaultSuppliers = [
            { name: 'Default Supplier', contact_number: '8888888888', address: 'Default Address' }
        ];

        for (const supplier of defaultSuppliers) {
            const { error } = await supabase
                .from('suppliers')
                .insert({
                    ...supplier,
                    company_id: companyId,
                    created_by: userId
                });

            if (error) {
                logger.error('Error creating default supplier:', error);
                throw error;
            }
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
                .eq('user_id', userId)
                .is('companies.deleted_at', null)
                .order('is_default', { ascending: false });

            if (error) throw error;
            
            // Filter out null companies (soft deleted)
            const companies = data
                .filter(item => item.companies !== null)
                .map(item => ({
                    ...item.companies,
                    role: item.role,
                    is_default: item.is_default
                }));

            return companies;
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

            // Check if company name already exists (excluding current)
            if (companyData.name) {
                const { data: existing, error: existingError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('name', companyData.name)
                    .eq('created_by', userId)
                    .neq('id', companyId)
                    .is('deleted_at', null)
                    .single();

                if (existing) {
                    throw new Error('Company with this name already exists');
                }
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

            // Get company name for logging
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('name')
                .eq('id', companyId)
                .single();

            if (companyError) throw companyError;

            // Soft delete company
            const { error } = await supabase
                .from('companies')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    name: company.name + '_deleted_' + Date.now() // Make name unique for deleted
                })
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
            // Check if user has access to this company
            const { data: access, error: accessError } = await supabase
                .from('user_companies')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (accessError) {
                throw new Error('Company not found or access denied');
            }

            // Reset all defaults
            const { error: resetError } = await supabase
                .from('user_companies')
                .update({ is_default: false })
                .eq('user_id', userId);

            if (resetError) throw resetError;

            // Set new default
            const { error } = await supabase
                .from('user_companies')
                .update({ is_default: true })
                .eq('user_id', userId)
                .eq('company_id', companyId);

            if (error) throw error;

            // Get the company details
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (companyError) throw companyError;

            logger.info(`Default company set to ${companyId} for user ${userId}`);
            return company;
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
                .is('companies.deleted_at', null)
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
                { count: invoicesCount },
                { count: vouchersCount }
            ] = await Promise.all([
                supabase.from('ledgers').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null),
                supabase.from('customers').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null),
                supabase.from('suppliers').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null),
                supabase.from('stock_items').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null),
                supabase.from('invoices').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null),
                supabase.from('vouchers').select('*', { count: 'exact' }).eq('company_id', companyId).is('deleted_at', null)
            ]);

            return {
                ledgers: ledgersCount || 0,
                customers: customersCount || 0,
                suppliers: suppliersCount || 0,
                stockItems: stockItemsCount || 0,
                invoices: invoicesCount || 0,
                vouchers: vouchersCount || 0
            };
        } catch (error) {
            logger.error('Error getting company stats:', error);
            throw error;
        }
    }

    async searchCompanies(userId, searchTerm) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select(`
                    id,
                    name,
                    address,
                    gst_number,
                    financial_year,
                    state,
                    user_companies!inner (
                        role,
                        is_default
                    )
                `)
                .eq('user_companies.user_id', userId)
                .is('deleted_at', null)
                .ilike('name', `%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            return data.map(item => ({
                ...item,
                role: item.user_companies[0]?.role,
                is_default: item.user_companies[0]?.is_default
            }));
        } catch (error) {
            logger.error('Error searching companies:', error);
            throw error;
        }
    }
}

module.exports = new CompanyModel();