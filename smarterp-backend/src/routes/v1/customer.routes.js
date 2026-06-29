const express = require('express');
const router = express.Router();
const CustomerController = require('../../controllers/customer.controller');
const { authenticate } = require('../../middleware/auth');

// All customer routes require authentication
router.use(authenticate);

// Routes
router.get('/', CustomerController.getAll);
router.get('/search', CustomerController.search);
router.post('/', CustomerController.create);
router.get('/:id', CustomerController.getById);
router.get('/:id/ledger', CustomerController.getLedger);
router.get('/:id/statement', CustomerController.getStatement);
router.put('/:id', CustomerController.update);
router.delete('/:id', CustomerController.delete);

module.exports = router;