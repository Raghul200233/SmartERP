const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class LedgerModel {
    async create(ledgerData, userId, companyId) {
        try {
            // Check if ledger already exists for this company
            const { data: existing, error: existingError } = await supabase
                .from('ledgers')
                .select('id')
                .eq('name', ledgerData.name)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existing) {
                throw new Error('Ledger with this name already exists');
            }

            // Check if group exists
            if (ledgerData.group_id) {
                const { data: group, error: groupError } = await supabase
                    .from('account_groups')
                    .select('id')
                    .eq('id', ledgerData.group_id)
                    .eq('company_id', companyId)
                    .single();

                if (groupError || !group) {
                    throw new Error('Invalid account group');
                }
            }

            const newLedger = {
                name: ledgerData.name,
                ledger_type: ledgerData.ledger_type,
                group_id: ledgerData.group_id || null,
                company_id: companyId,
                gst_number: ledgerData.gst_number || null,
                mobile: ledgerData.mobile || null,
                address: ledgerData.address || null,
                opening_balance: ledgerData.opening_balance || 0,
                credit_limit: ledgerData.credit_limit || 0,
                status: ledgerData.status || 'ACTIVE',
                created_by: userId
            };

            const { data, error } = await supabase
                .from('ledgers')
                .insert(newLedger)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Ledger created: ${data.name} for company ${companyId}`);
            return data;
        } catch (error) {
            logger.error('Error creating ledger:', error);
            throw error;
        }
    }

    async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('ledgers')
                .select(`
                    *,
                    account_groups!inner (
                        id,
                        name,
                        type
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null);

            // Apply filters
            if (filters.ledger_type) {
                query = query.eq('ledger_type', filters.ledger_type);
            }

            if (filters.group_id) {
                query = query.eq('group_id', filters.group_id);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.search) {
                query = query.ilike('name', `%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding ledgers:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('ledgers')
                .select(`
                    *,
                    account_groups!inner (
                        id,
                        name,
                        type
                    )
                `)
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding ledger:', error);
            throw error;
        }
    }

    async update(id, companyId, ledgerData) {
        try {
            // Check if ledger exists
            const { data: existing, error: existingError } = await supabase
                .from('ledgers')
                .select('id')
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (existingError || !existing) {
                throw new Error('Ledger not found');
            }

            // Check if group exists
            if (ledgerData.group_id) {
                const { data: group, error: groupError } = await supabase
                    .from('account_groups')
                    .select('id')
                    .eq('id', ledgerData.group_id)
                    .eq('company_id', companyId)
                    .single();

                if (groupError || !group) {
                    throw new Error('Invalid account group');
                }
            }

            const { data, error } = await supabase
                .from('ledgers')
                .update(ledgerData)
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Ledger updated: ${data.name}`);
            return data;
        } catch (error) {
            logger.error('Error updating ledger:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            // Check if ledger has transactions
            const { count, error: countError } = await supabase
                .from('voucher_entries')
                .select('*', { count: 'exact' })
                .eq('ledger_id', id);

            if (countError) throw countError;

            if (count > 0) {
                throw new Error('Cannot delete ledger with transactions');
            }

            const { error } = await supabase
                .from('ledgers')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    status: 'INACTIVE'
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Ledger soft deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting ledger:', error);
            throw error;
        }
    }

    async getStatement(ledgerId, companyId, startDate, endDate) {
        try {
            // Get ledger details
            const { data: ledger, error: ledgerError } = await supabase
                .from('ledgers')
                .select('*')
                .eq('id', ledgerId)
                .eq('company_id', companyId)
                .single();

            if (ledgerError) throw ledgerError;

            // Get all voucher entries for this ledger
            let query = supabase
                .from('voucher_entries')
                .select(`
                    *,
                    vouchers!inner (
                        id,
                        voucher_number,
                        voucher_type,
                        date,
                        narration,
                        created_at
                    )
                `)
                .eq('ledger_id', ledgerId);

            if (startDate) {
                query = query.gte('created_at', startDate);
            }

            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            query = query.order('created_at', { ascending: true });

            const { data: entries, error: entriesError } = await query;

            if (entriesError) throw entriesError;

            // Calculate running balance
            let balance = ledger.opening_balance || 0;
            const statement = entries.map(entry => {
                const amount = entry.amount || 0;
                let debit = 0;
                let credit = 0;

                if (entry.entry_type === 'DEBIT') {
                    debit = amount;
                    balance -= amount;
                } else {
                    credit = amount;
                    balance += amount;
                }

                return {
                    date: entry.vouchers.date || entry.vouchers.created_at,
                    voucher_number: entry.vouchers.voucher_number,
                    voucher_type: entry.vouchers.voucher_type,
                    narration: entry.vouchers.narration,
                    debit,
                    credit,
                    balance
                };
            });

            return {
                ledger: {
                    id: ledger.id,
                    name: ledger.name,
                    type: ledger.ledger_type,
                    opening_balance: ledger.opening_balance || 0
                },
                statement,
                closing_balance: balance
            };
        } catch (error) {
            logger.error('Error getting ledger statement:', error);
            throw error;
        }
    }

    async getByType(companyId, ledgerType) {
        try {
            const { data, error } = await supabase
                .from('ledgers')
                .select('*')
                .eq('company_id', companyId)
                .eq('ledger_type', ledgerType)
                .eq('status', 'ACTIVE')
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error getting ledgers by type:', error);
            throw error;
        }
    }

    async search(companyId, searchTerm, limit = 20) {
        try {
            const { data, error } = await supabase
                .from('ledgers')
                .select(`
                    *,
                    account_groups!inner (
                        name,
                        type
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .eq('status', 'ACTIVE')
                .ilike('name', `%${searchTerm}%`)
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error searching ledgers:', error);
            throw error;
        }
    }
}

module.exports = new LedgerModel();