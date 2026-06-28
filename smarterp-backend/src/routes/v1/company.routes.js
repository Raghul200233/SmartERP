const express = require('express');
const router = express.Router();
const CompanyController = require('../../controllers/company.controller');
const { authenticate } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { companySchema } = require('../../utils/validators');

// All company routes require authentication
router.use(authenticate);

// Routes
router.get('/',
    CompanyController.getAll
);

router.get('/default',
    CompanyController.getDefault
);

router.get('/search',
    CompanyController.search
);

router.post('/',
    validateRequest(companySchema),
    CompanyController.create
);

router.get('/:id',
    CompanyController.getById
);

router.get('/:id/stats',
    CompanyController.getStats
);

router.put('/:id',
    CompanyController.update
);

router.delete('/:id',
    CompanyController.delete
);

router.post('/:id/default',
    CompanyController.setDefault
);

module.exports = router;