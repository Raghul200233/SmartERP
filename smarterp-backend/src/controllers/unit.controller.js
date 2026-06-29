const UnitModel = require('../models/Unit');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class UnitController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const unitData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const unit = await UnitModel.create(unitData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'UNIT_CREATED',
                resource_type: 'units',
                resource_id: unit.id
            });

            res.status(201).json({
                success: true,
                message: 'Unit created successfully',
                data: unit
            });
        } catch (error) {
            logger.error('Create unit error:', error);
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

            const units = await UnitModel.findAll(companyId);

            res.json({
                success: true,
                data: units,
                count: units.length
            });
        } catch (error) {
            logger.error('Get units error:', error);
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

            const unit = await UnitModel.findById(id, companyId);

            res.json({
                success: true,
                data: unit
            });
        } catch (error) {
            logger.error('Get unit error:', error);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const unitData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const unit = await UnitModel.update(id, companyId, unitData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'UNIT_UPDATED',
                resource_type: 'units',
                resource_id: unit.id
            });

            res.json({
                success: true,
                message: 'Unit updated successfully',
                data: unit
            });
        } catch (error) {
            logger.error('Update unit error:', error);
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

            await UnitModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'UNIT_DELETED',
                resource_type: 'units',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Unit deleted successfully'
            });
        } catch (error) {
            logger.error('Delete unit error:', error);
            next(error);
        }
    }
}

module.exports = new UnitController();