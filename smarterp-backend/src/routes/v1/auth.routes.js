const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth');
const { validateRequest } = require('../../middleware/validation');
const { userSchema, loginSchema } = require('../../utils/validators');

// Public routes
router.post('/register', 
    validateRequest(userSchema),
    AuthController.register
);

router.post('/login',
    validateRequest(loginSchema),
    AuthController.login
);

router.post('/refresh-token',
    AuthController.refreshToken
);

router.post('/forgot-password',
    AuthController.forgotPassword
);

router.post('/reset-password',
    AuthController.resetPassword
);

router.post('/verify-token',
    AuthController.verifyToken
);

// Protected routes
router.use(authenticate);

router.post('/logout',
    AuthController.logout
);

router.post('/change-password',
    AuthController.changePassword
);

router.get('/me',
    AuthController.getMe
);

module.exports = router;