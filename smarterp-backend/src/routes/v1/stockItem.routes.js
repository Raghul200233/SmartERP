const express = require('express');
const router = express.Router();
const StockItemController = require('../../controllers/stockItem.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', StockItemController.getAll);
router.get('/low-stock', StockItemController.getLowStock);
router.get('/stock-value', StockItemController.getStockValue);
router.get('/search', StockItemController.search);
router.post('/', StockItemController.create);
router.get('/:id', StockItemController.getById);
router.put('/:id', StockItemController.update);
router.delete('/:id', StockItemController.delete);

module.exports = router;