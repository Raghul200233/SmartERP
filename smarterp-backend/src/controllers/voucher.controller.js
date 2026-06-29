const VoucherModel = require('../models/Voucher');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class VoucherController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const voucherData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate voucher type
            const validTypes = await VoucherModel.getVoucherTypes();
            if (!validTypes.includes(voucherData.voucher_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid voucher type'
                });
            }

            const voucher = await VoucherModel.create(voucherData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: `VOUCHER_${voucherData.voucher_type}_CREATED`,
                resource_type: 'vouchers',
                resource_id: voucher.id
            });

            res.status(201).json({
                success: true,
                message: `${voucherData.voucher_type} voucher created successfully`,
                data: voucher
            });
        } catch (error) {
            logger.error('Create voucher error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create voucher'
            });
        }
    }

    async getAll(req, res, next) {
        try {
            const { companyId } = req.query;
            const filters = {
                voucher_type: req.query.type,
                status: req.query.status,
                start_date: req.query.startDate,
                end_date: req.query.endDate,
                search: req.query.search
            };

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const vouchers = await VoucherModel.findAll(companyId, filters);

            res.json({
                success: true,
                data: vouchers,
                count: vouchers.length
            });
        } catch (error) {
            logger.error('Get vouchers error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch vouchers'
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

            const voucher = await VoucherModel.findById(id, companyId);

            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    message: 'Voucher not found'
                });
            }

            res.json({
                success: true,
                data: voucher
            });
        } catch (error) {
            logger.error('Get voucher error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher'
            });
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const voucherData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const voucher = await VoucherModel.update(id, companyId, voucherData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: `VOUCHER_${voucher.voucher_type}_UPDATED`,
                resource_type: 'vouchers',
                resource_id: voucher.id
            });

            res.json({
                success: true,
                message: 'Voucher updated successfully',
                data: voucher
            });
        } catch (error) {
            logger.error('Update voucher error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update voucher'
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

            await VoucherModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'VOUCHER_DELETED',
                resource_type: 'vouchers',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Voucher deleted successfully'
            });
        } catch (error) {
            logger.error('Delete voucher error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete voucher'
            });
        }
    }

    async getTypes(req, res, next) {
        try {
            const types = await VoucherModel.getVoucherTypes();

            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            logger.error('Get voucher types error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher types'
            });
        }
    }

    async getStats(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const stats = await VoucherModel.getStats(companyId, startDate, endDate);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Get voucher stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher stats'
            });
        }
    }
}

module.exports = new VoucherController();