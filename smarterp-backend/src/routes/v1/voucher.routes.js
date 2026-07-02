const express = require('express');
const router = express.Router();
const VoucherController = require('../../controllers/voucher.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);


// GET routes - specific first
router.get('/payment-stats', VoucherController.getPaymentStats);
router.patch('/:id/pay', VoucherController.markAsPaid);
router.get('/:id/statement', VoucherController.getLedgerStatement);
router.get('/types', VoucherController.getTypes);
router.get('/stats', VoucherController.getStats);
router.get('/', VoucherController.getAll);
router.post('/', VoucherController.create);
router.get('/:id', VoucherController.getById);
router.get('/:id/pdf', VoucherController.generatePDF);

module.exports = router;