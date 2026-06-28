const AccountGroupModel = require('../models/AccountGroup');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AccountGroupController {
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

            const group = await AccountGroupModel.create(groupData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'ACCOUNT_GROUP_CREATED',
                resource_type: 'account_groups',
                resource_id: group.id
            });

            res.status(201).json({
                success: true,
                message: 'Account group created successfully',
                data: group
            });
        } catch (error) {
            logger.error('Create account group error:', error);
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

            const groups = await AccountGroupModel.findAll(companyId);

            res.json({
                success: true,
                data: groups,
                count: groups.length
            });
        } catch (error) {
            logger.error('Get account groups error:', error);
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

            const group = await AccountGroupModel.findById(id, companyId);

            res.json({
                success: true,
                data: group
            });
        } catch (error) {
            logger.error('Get account group error:', error);
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

            const group = await AccountGroupModel.update(id, companyId, groupData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'ACCOUNT_GROUP_UPDATED',
                resource_type: 'account_groups',
                resource_id: group.id
            });

            res.json({
                success: true,
                message: 'Account group updated successfully',
                data: group
            });
        } catch (error) {
            logger.error('Update account group error:', error);
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

            await AccountGroupModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'ACCOUNT_GROUP_DELETED',
                resource_type: 'account_groups',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Account group deleted successfully'
            });
        } catch (error) {
            logger.error('Delete account group error:', error);
            next(error);
        }
    }

    async getGroupTypes(req, res, next) {
        try {
            const types = await AccountGroupModel.getGroupTypes();

            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            logger.error('Get group types error:', error);
            next(error);
        }
    }

    async getDefaultGroups(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const groups = await AccountGroupModel.getDefaultGroups(companyId);

            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            logger.error('Get default groups error:', error);
            next(error);
        }
    }
}

module.exports = new AccountGroupController();