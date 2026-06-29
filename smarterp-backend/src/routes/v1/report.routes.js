const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/report.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Financial Reports
router.get('/balance-sheet', ReportController.getBalanceSheet);
router.get('/profit-loss', ReportController.getProfitLoss);
router.get('/trial-balance', ReportController.getTrialBalance);

// Inventory Reports
router.get('/stock-summary', ReportController.getStockSummary);

// GST Reports
router.get('/gst', ReportController.getGSTReport);

// Sales & Purchase Reports
router.get('/sales', ReportController.getSalesReport);
router.get('/purchases', ReportController.getPurchaseReport);

module.exports = router;