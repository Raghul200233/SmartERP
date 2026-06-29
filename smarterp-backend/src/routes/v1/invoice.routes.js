const express = require('express');
const router = express.Router();
const InvoiceController = require('../../controllers/invoice.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', InvoiceController.getAll);
router.get('/stats', InvoiceController.getStats);
router.post('/', InvoiceController.create);
router.get('/:id', InvoiceController.getById);
router.put('/:id', InvoiceController.update);
router.delete('/:id', InvoiceController.delete);
router.patch('/:id/status', InvoiceController.updateStatus);
router.get('/:id/pdf', InvoiceController.generatePDF);

module.exports = router;