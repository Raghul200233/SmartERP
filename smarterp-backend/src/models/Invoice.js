const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class InvoiceModel {
    async create(invoiceData, userId, companyId) {
        try {
            // Generate invoice number
            const invoiceNumber = await this.generateInvoiceNumber(companyId);

            const invoice = {
                invoice_number: invoiceNumber,
                invoice_type: invoiceData.invoice_type || 'TAX_INVOICE',
                date: invoiceData.date || new Date().toISOString().split('T')[0],
                customer_id: invoiceData.customer_id || null,
                supplier_id: invoiceData.supplier_id || null,
                total_amount: invoiceData.total_amount || 0,
                gst_amount: invoiceData.gst_amount || 0,
                discount_amount: invoiceData.discount_amount || 0,
                net_amount: invoiceData.net_amount || 0,
                status: invoiceData.status || 'DRAFT',
                terms_conditions: invoiceData.terms_conditions || null,
                company_id: companyId,
                created_by: userId
            };

            const { data, error } = await supabase
                .from('invoices')
                .insert(invoice)
                .select()
                .single();

            if (error) throw error;

            // Create invoice items
            if (invoiceData.items && invoiceData.items.length > 0) {
                for (const item of invoiceData.items) {
                    await this.createInvoiceItem({
                        invoice_id: data.id,
                        stock_item_id: item.stock_item_id,
                        quantity: item.quantity,
                        rate: item.rate,
                        amount: item.amount,
                        gst_percentage: item.gst_percentage || 0,
                        gst_amount: item.gst_amount || 0,
                        total_amount: item.total_amount || 0
                    });
                }
            }

            logger.info(`Invoice created: ${invoiceNumber}`);
            return data;
        } catch (error) {
            logger.error('Error creating invoice:', error);
            throw error;
        }
    }

    async createInvoiceItem(itemData) {
        const { error } = await supabase
            .from('invoice_items')
            .insert(itemData);

        if (error) {
            logger.error('Error creating invoice item:', error);
            throw error;
        }
    }

    async generateInvoiceNumber(companyId) {
        // Get last invoice number
        const { data, error } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            logger.error('Error generating invoice number:', error);
            return 'INV-000001';
        }

        let lastNumber = 0;
        if (data && data.length > 0) {
            const parts = data[0].invoice_number.split('-');
            lastNumber = parseInt(parts[parts.length - 1]) || 0;
        }

        const newNumber = lastNumber + 1;
        return `INV-${String(newNumber).padStart(6, '0')}`;
    }

async findAll(companyId, filters = {}) {
        try {
            let query = supabase
                .from('invoices')
                .select(`
                    *,
                    customers (
                        id,
                        name,
                        mobile,
                        email
                    )
                `)
                .eq('company_id', companyId)
                .is('deleted_at', null);

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.invoice_type) {
                query = query.eq('invoice_type', filters.invoice_type);
            }

            if (filters.start_date) {
                query = query.gte('date', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('date', filters.end_date);
            }

            if (filters.search) {
                query = query.ilike('invoice_number', `%${filters.search}%`);
            }

            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                logger.error('Supabase error in findAll:', error);
                throw error;
            }
            
            return data || [];
        } catch (error) {
            logger.error('Error finding invoices:', error);
            throw error;
        }
    }

    async findById(id, companyId) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    customers!inner (
                        id,
                        name,
                        mobile,
                        email,
                        address,
                        gst_number
                    ),
                    invoice_items (
                        *,
                        stock_items!inner (
                            id,
                            name,
                            sku
                        )
                    ),
                    company:companies!inner (
                        name,
                        address,
                        gst_number,
                        mobile,
                        email
                    )
                `)
                .eq('id', id)
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding invoice:', error);
            throw error;
        }
    }

    async update(id, companyId, invoiceData) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update({
                    date: invoiceData.date,
                    customer_id: invoiceData.customer_id,
                    total_amount: invoiceData.total_amount,
                    gst_amount: invoiceData.gst_amount,
                    discount_amount: invoiceData.discount_amount,
                    net_amount: invoiceData.net_amount,
                    status: invoiceData.status,
                    terms_conditions: invoiceData.terms_conditions
                })
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            // Update items if provided
            if (invoiceData.items) {
                // Delete existing items
                await supabase
                    .from('invoice_items')
                    .delete()
                    .eq('invoice_id', id);

                // Create new items
                for (const item of invoiceData.items) {
                    await this.createInvoiceItem({
                        invoice_id: id,
                        stock_item_id: item.stock_item_id,
                        quantity: item.quantity,
                        rate: item.rate,
                        amount: item.amount,
                        gst_percentage: item.gst_percentage || 0,
                        gst_amount: item.gst_amount || 0,
                        total_amount: item.total_amount || 0
                    });
                }
            }

            logger.info(`Invoice updated: ${data.invoice_number}`);
            return data;
        } catch (error) {
            logger.error('Error updating invoice:', error);
            throw error;
        }
    }

    async softDelete(id, companyId) {
        try {
            const { error } = await supabase
                .from('invoices')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    status: 'CANCELLED'
                })
                .eq('id', id)
                .eq('company_id', companyId);

            if (error) throw error;

            logger.info(`Invoice deleted: ${id}`);
            return { success: true };
        } catch (error) {
            logger.error('Error deleting invoice:', error);
            throw error;
        }
    }

    async updateStatus(id, companyId, status) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update({ status })
                .eq('id', id)
                .eq('company_id', companyId)
                .select()
                .single();

            if (error) throw error;

            logger.info(`Invoice status updated: ${data.invoice_number} -> ${status}`);
            return data;
        } catch (error) {
            logger.error('Error updating invoice status:', error);
            throw error;
        }
    }

    async getStats(companyId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('status, total_amount, net_amount')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const stats = {
                total: 0,
                paid: 0,
                pending: 0,
                cancelled: 0,
                totalAmount: 0,
                totalNetAmount: 0
            };

            for (const invoice of data) {
                stats.total++;
                stats[invoice.status.toLowerCase()] = (stats[invoice.status.toLowerCase()] || 0) + 1;
                stats.totalAmount += invoice.total_amount || 0;
                stats.totalNetAmount += invoice.net_amount || 0;
            }

            return stats;
        } catch (error) {
            logger.error('Error getting invoice stats:', error);
            throw error;
        }
    }
}

module.exports = new InvoiceModel();