const express = require('express');
const router = express.Router();
const AccountGroupController = require('../../controllers/accountGroup.controller');
const { authenticate } = require('../../middleware/auth');

// All account group routes require authentication
router.use(authenticate);

// Routes
router.get('/',
    AccountGroupController.getAll
);

router.get('/types',
    AccountGroupController.getGroupTypes
);

router.get('/default',
    AccountGroupController.getDefaultGroups
);

router.post('/',
    AccountGroupController.create
);

router.get('/:id',
    AccountGroupController.getById
);

router.put('/:id',
    AccountGroupController.update
);

router.delete('/:id',
    AccountGroupController.delete
);

module.exports = router;