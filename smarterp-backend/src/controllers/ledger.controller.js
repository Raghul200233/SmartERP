const { supabase } = require('../config/database');
const LedgerModel = require('../models/Ledger');
const AccountGroupModel = require('../models/AccountGroup');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class LedgerController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const ledgerData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const ledger = await LedgerModel.create(ledgerData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'LEDGER_CREATED',
                resource_type: 'ledgers',
                resource_id: ledger.id
            });

            res.status(201).json({
                success: true,
                message: 'Ledger created successfully',
                data: ledger
            });
        } catch (error) {
            logger.error('Create ledger error:', error);
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const { companyId } = req.query;
            const filters = {
                ledger_type: req.query.type,
                group_id: req.query.groupId,
                status: req.query.status,
                search: req.query.search
            };

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const ledgers = await LedgerModel.findAll(companyId, filters);

            res.json({
                success: true,
                data: ledgers,
                count: ledgers.length
            });
        } catch (error) {
            logger.error('Get ledgers error:', error);
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

            const ledger = await LedgerModel.findById(id, companyId);

            res.json({
                success: true,
                data: ledger
            });
        } catch (error) {
            logger.error('Get ledger error:', error);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const ledgerData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const ledger = await LedgerModel.update(id, companyId, ledgerData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'LEDGER_UPDATED',
                resource_type: 'ledgers',
                resource_id: ledger.id,
                changes: ledgerData
            });

            res.json({
                success: true,
                message: 'Ledger updated successfully',
                data: ledger
            });
        } catch (error) {
            logger.error('Update ledger error:', error);
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

        const result = await LedgerModel.softDelete(id, companyId);

        await AuditLog.create({
            user_id: req.user.id,
            company_id: companyId,
            action: result.deactivated ? 'LEDGER_DEACTIVATED' : 'LEDGER_DELETED',
            resource_type: 'ledgers',
            resource_id: id
        });

        res.json({
            success: true,
            message: result.message || 'Ledger deleted successfully',
            deactivated: result.deactivated
        });
    } catch (error) {
        logger.error('Delete ledger error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to delete ledger'
        });
    }
}

    async getStatement(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const statement = await LedgerModel.getStatement(
                id,
                companyId,
                startDate,
                endDate
            );

            res.json({
                success: true,
                data: statement
            });
        } catch (error) {
            logger.error('Get ledger statement error:', error);
            next(error);
        }
    }

    async getByType(req, res, next) {
        try {
            const { type } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const ledgers = await LedgerModel.getByType(companyId, type);

            res.json({
                success: true,
                data: ledgers
            });
        } catch (error) {
            logger.error('Get ledgers by type error:', error);
            next(error);
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

            const ledgers = await LedgerModel.search(companyId, q);

            res.json({
                success: true,
                data: ledgers
            });
        } catch (error) {
            logger.error('Search ledgers error:', error);
            next(error);
        }
    }
}

module.exports = new LedgerController();