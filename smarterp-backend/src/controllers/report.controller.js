const ReportModel = require('../models/Report');
const logger = require('../utils/logger');

class ReportController {
    async getBalanceSheet(req, res, next) {
        try {
            const { companyId, asOnDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const date = asOnDate || new Date().toISOString().split('T')[0];
            const report = await ReportModel.getBalanceSheet(companyId, date);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get balance sheet error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate balance sheet'
            });
        }
    }

    async getProfitLoss(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Default to current month if no dates provided
            const now = new Date();
            const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || now.toISOString().split('T')[0];

            const report = await ReportModel.getProfitLoss(companyId, start, end);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get profit & loss error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate profit & loss'
            });
        }
    }

    async getTrialBalance(req, res, next) {
        try {
            const { companyId, asOnDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const date = asOnDate || new Date().toISOString().split('T')[0];
            const report = await ReportModel.getTrialBalance(companyId, date);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get trial balance error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate trial balance'
            });
        }
    }

    async getStockSummary(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const report = await ReportModel.getStockSummary(companyId);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get stock summary error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate stock summary'
            });
        }
    }

    async getGSTReport(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const now = new Date();
            const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || now.toISOString().split('T')[0];

            const report = await ReportModel.getGSTReport(companyId, start, end);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get GST report error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate GST report'
            });
        }
    }

    async getSalesReport(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const now = new Date();
            const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || now.toISOString().split('T')[0];

            const report = await ReportModel.getSalesReport(companyId, start, end);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get sales report error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate sales report'
            });
        }
    }

    async getPurchaseReport(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const now = new Date();
            const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const end = endDate || now.toISOString().split('T')[0];

            const report = await ReportModel.getPurchaseReport(companyId, start, end);

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            logger.error('Get purchase report error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate purchase report'
            });
        }
    }
}

module.exports = new ReportController();