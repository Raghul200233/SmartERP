const express = require('express');
const router = express.Router();
const UnitController = require('../../controllers/unit.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', UnitController.getAll);
router.post('/', UnitController.create);
router.get('/:id', UnitController.getById);
router.put('/:id', UnitController.update);
router.delete('/:id', UnitController.delete);

module.exports = router;