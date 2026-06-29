const StockGroupModel = require('../models/StockGroup');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class StockGroupController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const groupData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const group = await StockGroupModel.create(groupData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_GROUP_CREATED',
                resource_type: 'stock_groups',
                resource_id: group.id
            });

            res.status(201).json({
                success: true,
                message: 'Stock group created successfully',
                data: group
            });
        } catch (error) {
            logger.error('Create stock group error:', error);
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const groups = await StockGroupModel.findAll(companyId);

            res.json({
                success: true,
                data: groups,
                count: groups.length
            });
        } catch (error) {
            logger.error('Get stock groups error:', error);
            next(error);
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

            const group = await StockGroupModel.findById(id, companyId);

            res.json({
                success: true,
                data: group
            });
        } catch (error) {
            logger.error('Get stock group error:', error);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const groupData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const group = await StockGroupModel.update(id, companyId, groupData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_GROUP_UPDATED',
                resource_type: 'stock_groups',
                resource_id: group.id
            });

            res.json({
                success: true,
                message: 'Stock group updated successfully',
                data: group
            });
        } catch (error) {
            logger.error('Update stock group error:', error);
            next(error);
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

            await StockGroupModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_GROUP_DELETED',
                resource_type: 'stock_groups',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Stock group deleted successfully'
            });
        } catch (error) {
            logger.error('Delete stock group error:', error);
            next(error);
        }
    }
}

module.exports = new StockGroupController();