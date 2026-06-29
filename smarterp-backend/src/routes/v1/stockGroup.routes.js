const express = require('express');
const router = express.Router();
const StockGroupController = require('../../controllers/stockGroup.controller');
const { authenticate } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Make sure all controller methods exist
router.get('/', StockGroupController.getAll);
router.post('/', StockGroupController.create);
router.get('/:id', StockGroupController.getById);
router.put('/:id', StockGroupController.update);
router.delete('/:id', StockGroupController.delete);

module.exports = router;