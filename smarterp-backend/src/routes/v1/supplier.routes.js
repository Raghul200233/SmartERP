const express = require('express');
const router = express.Router();
const SupplierController = require('../../controllers/supplier.controller');
const { authenticate } = require('../../middleware/auth');

// All supplier routes require authentication
router.use(authenticate);

// Routes
router.get('/', SupplierController.getAll);
router.get('/search', SupplierController.search);
router.post('/', SupplierController.create);
router.get('/:id', SupplierController.getById);
router.get('/:id/purchases', SupplierController.getPurchaseHistory);
router.get('/:id/payments', SupplierController.getPaymentHistory);
router.put('/:id', SupplierController.update);
router.delete('/:id', SupplierController.delete);

module.exports = router;