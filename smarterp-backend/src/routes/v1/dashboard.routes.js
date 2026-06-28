const express = require('express');
const router = express.Router();
const DashboardController = require('../../controllers/dashboard.controller');
const { authenticate } = require('../../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

router.get('/overview',
    DashboardController.getOverview
);

router.get('/sales',
    DashboardController.getMonthlySales
);

module.exports = router;