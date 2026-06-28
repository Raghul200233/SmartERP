const express = require('express');
const router = express.Router();
const LedgerController = require('../../controllers/ledger.controller');
const { authenticate } = require('../../middleware/auth');

// All ledger routes require authentication
router.use(authenticate);

// Routes
router.get('/',
    LedgerController.getAll
);

router.get('/search',
    LedgerController.search
);

router.get('/statement/:id',
    LedgerController.getStatement
);

router.get('/type/:type',
    LedgerController.getByType
);

router.post('/',
    LedgerController.create
);

router.get('/:id',
    LedgerController.getById
);

router.put('/:id',
    LedgerController.update
);

router.delete('/:id',
    LedgerController.delete
);

module.exports = router;