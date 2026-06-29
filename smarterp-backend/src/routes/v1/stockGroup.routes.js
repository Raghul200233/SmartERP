const express = require('express');
const router = express.Router();
const StockGroupController = require('../../controllers/stockGroup.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', StockGroupController.getAll);
router.post('/', StockGroupController.create);
router.get('/:id', StockGroupController.getById);
router.put('/:id', StockGroupController.update);
router.delete('/:id', StockGroupController.delete);

module.exports = router;