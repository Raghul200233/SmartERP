const { supabase } = require('../config/database');
const SupplierModel = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class SupplierController {
    // Create a new supplier
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const supplierData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate required fields
            if (!supplierData.name || !supplierData.name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier name is required'
                });
            }

            const supplier = await SupplierModel.create(supplierData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'SUPPLIER_CREATED',
                resource_type: 'suppliers',
                resource_id: supplier.id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({
                success: true,
                message: 'Supplier created successfully',
                data: supplier
            });
        } catch (error) {
            logger.error('Create supplier error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create supplier'
            });
        }
    }

    // Get all suppliers with filters
    async getAll(req, res, next) {
        try {
            const { companyId } = req.query;
            const filters = {
                search: req.query.search
            };

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const suppliers = await SupplierModel.findAll(companyId, filters);

            res.json({
                success: true,
                data: suppliers,
                count: suppliers.length
            });
        } catch (error) {
            logger.error('Get suppliers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch suppliers'
            });
        }
    }

    // Get supplier by ID
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

            const supplier = await SupplierModel.findById(id, companyId);

            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
            }

            res.json({
                success: true,
                data: supplier
            });
        } catch (error) {
            logger.error('Get supplier error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch supplier'
            });
        }
    }

    // Update supplier
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const supplierData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate required fields
            if (supplierData.name && !supplierData.name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Supplier name cannot be empty'
                });
            }

            const supplier = await SupplierModel.update(id, companyId, supplierData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'SUPPLIER_UPDATED',
                resource_type: 'suppliers',
                resource_id: supplier.id,
                changes: supplierData,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Supplier updated successfully',
                data: supplier
            });
        } catch (error) {
            logger.error('Update supplier error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update supplier'
            });
        }
    }

    // Delete supplier (soft delete)
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

            await SupplierModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'SUPPLIER_DELETED',
                resource_type: 'suppliers',
                resource_id: id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Supplier deleted successfully'
            });
        } catch (error) {
            logger.error('Delete supplier error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete supplier'
            });
        }
    }

    // Get purchase history for a supplier
    async getPurchaseHistory(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const supplier = await SupplierModel.findById(id, companyId);
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
            }

            const purchases = await SupplierModel.getPurchaseHistory(id, companyId);

            // Calculate total
            const totalAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

            res.json({
                success: true,
                data: {
                    supplier: {
                        id: supplier.id,
                        name: supplier.name,
                        contact_number: supplier.contact_number,
                        outstanding_dues: supplier.outstanding_dues
                    },
                    purchases,
                    summary: {
                        total_purchases: purchases.length,
                        total_amount: totalAmount
                    }
                }
            });
        } catch (error) {
            logger.error('Get purchase history error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch purchase history'
            });
        }
    }

    // Get payment history for a supplier
    async getPaymentHistory(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const supplier = await SupplierModel.findById(id, companyId);
            if (!supplier) {
                return res.status(404).json({
                    success: false,
                    message: 'Supplier not found'
                });
            }

            // Get payment vouchers for this supplier
            const { data: payments, error } = await supabase
                .from('vouchers')
                .select(`
                    id,
                    voucher_number,
                    date,
                    amount,
                    narration,
                    voucher_type
                `)
                .eq('ledger_id', id)
                .eq('voucher_type', 'PAYMENT')
                .eq('company_id', companyId)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            if (error) throw error;

            const totalAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

            res.json({
                success: true,
                data: {
                    supplier: {
                        id: supplier.id,
                        name: supplier.name
                    },
                    payments: payments || [],
                    summary: {
                        total_payments: payments?.length || 0,
                        total_amount: totalAmount
                    }
                }
            });
        } catch (error) {
            logger.error('Get payment history error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch payment history'
            });
        }
    }

    // Search suppliers
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

            const suppliers = await SupplierModel.search(companyId, q);

            res.json({
                success: true,
                data: suppliers
            });
        } catch (error) {
            logger.error('Search suppliers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search suppliers'
            });
        }
    }
}

module.exports = new SupplierController();