const StockItemModel = require('../models/StockItem');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class StockItemController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const itemData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const item = await StockItemModel.create(itemData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_ITEM_CREATED',
                resource_type: 'stock_items',
                resource_id: item.id
            });

            res.status(201).json({
                success: true,
                message: 'Stock item created successfully',
                data: item
            });
        } catch (error) {
            logger.error('Create stock item error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create stock item'
            });
        }
    }

async getAll(req, res, next) {
    try {
        const { companyId } = req.query;
        const filters = {
            stock_group_id: req.query.groupId,
            search: req.query.search
        };

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const items = await StockItemModel.findAll(companyId, filters);

        res.json({
            success: true,
            data: items || [],
            count: items?.length || 0
        });
    } catch (error) {
        logger.error('Get stock items error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch stock items',
            data: [] // Return empty array on error
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

            const item = await StockItemModel.findById(id, companyId);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Stock item not found'
                });
            }

            res.json({
                success: true,
                data: item
            });
        } catch (error) {
            logger.error('Get stock item error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch stock item'
            });
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const itemData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const item = await StockItemModel.update(id, companyId, itemData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_ITEM_UPDATED',
                resource_type: 'stock_items',
                resource_id: item.id
            });

            res.json({
                success: true,
                message: 'Stock item updated successfully',
                data: item
            });
        } catch (error) {
            logger.error('Update stock item error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update stock item'
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

            await StockItemModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'STOCK_ITEM_DELETED',
                resource_type: 'stock_items',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Stock item deleted successfully'
            });
        } catch (error) {
            logger.error('Delete stock item error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete stock item'
            });
        }
    }

    async getLowStock(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const items = await StockItemModel.getLowStockItems(companyId);

            res.json({
                success: true,
                data: items
            });
        } catch (error) {
            logger.error('Get low stock error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch low stock items'
            });
        }
    }

    async getStockValue(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const value = await StockItemModel.getStockValue(companyId);

            res.json({
                success: true,
                data: { value }
            });
        } catch (error) {
            logger.error('Get stock value error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch stock value'
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

            const items = await StockItemModel.search(companyId, q);

            res.json({
                success: true,
                data: items
            });
        } catch (error) {
            logger.error('Search stock items error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search stock items'
            });
        }
    }
}

module.exports = new StockItemController();