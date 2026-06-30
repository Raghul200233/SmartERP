const express = require('express');
const router = express.Router();
const VoucherController = require('../../controllers/voucher.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', VoucherController.getAll);
router.get('/types', VoucherController.getTypes);
router.get('/stats', VoucherController.getStats);
router.post('/', VoucherController.create);
router.get('/:id', VoucherController.getById);

module.exports = router;