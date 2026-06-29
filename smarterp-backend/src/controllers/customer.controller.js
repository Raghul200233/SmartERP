const CustomerModel = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class CustomerController {
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

            const customer = await CustomerModel.create(customerData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'CUSTOMER_CREATED',
                resource_type: 'customers',
                resource_id: customer.id
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
                data: customers,
                count: customers.length
            });
        } catch (error) {
            logger.error('Get customers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch customers'
            });
        }
    }

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

            const customer = await CustomerModel.update(id, companyId, customerData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'CUSTOMER_UPDATED',
                resource_type: 'customers',
                resource_id: customer.id
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
                resource_id: id
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

            const ledger = await CustomerModel.getLedger(id, companyId, startDate, endDate);

            res.json({
                success: true,
                data: ledger
            });
        } catch (error) {
            logger.error('Get customer ledger error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch customer ledger'
            });
        }
    }

    async search(req, res, next) {
        try {
            const { q, companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            if (!q) {
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