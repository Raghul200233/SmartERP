const { supabase } = require('../config/database');
const CustomerModel = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class CustomerController {
    // Create a new customer
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const customerData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate required fields
            if (!customerData.name || !customerData.name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer name is required'
                });
            }

            const customer = await CustomerModel.create(customerData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'CUSTOMER_CREATED',
                resource_type: 'customers',
                resource_id: customer.id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({
                success: true,
                message: 'Customer created successfully',
                data: customer
            });
        } catch (error) {
            logger.error('Create customer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create customer'
            });
        }
    }

    // Get all customers with filters
async getAll(req, res, next) {
    try {
        const { companyId } = req.query;
        const filters = {
            search: req.query.search,
            has_outstanding: req.query.hasOutstanding
        };

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const customers = await CustomerModel.findAll(companyId, filters);

        res.json({
            success: true,
            data: customers || [], // Ensure we always return an array
            count: customers?.length || 0
        });
    } catch (error) {
        logger.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch customers',
            data: [] // Return empty array on error
        });
    }
}

    // Get customer by ID
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const customer = await CustomerModel.findById(id, companyId);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            res.json({
                success: true,
                data: customer
            });
        } catch (error) {
            logger.error('Get customer error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch customer'
            });
        }
    }

    // Update customer
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const customerData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate required fields
            if (customerData.name && !customerData.name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer name cannot be empty'
                });
            }

            const customer = await CustomerModel.update(id, companyId, customerData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'CUSTOMER_UPDATED',
                resource_type: 'customers',
                resource_id: customer.id,
                changes: customerData,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Customer updated successfully',
                data: customer
            });
        } catch (error) {
            logger.error('Update customer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update customer'
            });
        }
    }

    // Delete customer (soft delete)
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            await CustomerModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'CUSTOMER_DELETED',
                resource_type: 'customers',
                resource_id: id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Customer deleted successfully'
            });
        } catch (error) {
            logger.error('Delete customer error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete customer'
            });
        }
    }

    // Get customer ledger
    async getLedger(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const customer = await CustomerModel.findById(id, companyId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            const ledger = await CustomerModel.getLedger(id, companyId, startDate, endDate);

            res.json({
                success: true,
                data: {
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        mobile: customer.mobile,
                        email: customer.email,
                        outstanding_balance: customer.outstanding_balance
                    },
                    transactions: ledger
                }
            });
        } catch (error) {
            logger.error('Get customer ledger error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch customer ledger'
            });
        }
    }

    // Get customer statement
    async getStatement(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const customer = await CustomerModel.findById(id, companyId);
            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Get all transactions for this customer
            const ledger = await CustomerModel.getLedger(id, companyId);

            // Calculate summary
            let totalDebit = 0;
            let totalCredit = 0;
            ledger.forEach(entry => {
                totalDebit += entry.debit || 0;
                totalCredit += entry.credit || 0;
            });

            const statement = {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    mobile: customer.mobile,
                    email: customer.email,
                    address: customer.address,
                    gst_number: customer.gst_number
                },
                summary: {
                    total_debit: totalDebit,
                    total_credit: totalCredit,
                    balance: totalDebit - totalCredit,
                    outstanding: customer.outstanding_balance
                },
                transactions: ledger
            };

            res.json({
                success: true,
                data: statement
            });
        } catch (error) {
            logger.error('Get customer statement error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch customer statement'
            });
        }
    }

    // Search customers
    async search(req, res, next) {
        try {
            const { q, companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const customers = await CustomerModel.search(companyId, q);

            res.json({
                success: true,
                data: customers
            });
        } catch (error) {
            logger.error('Search customers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search customers'
            });
        }
    }
}

module.exports = new CustomerController();