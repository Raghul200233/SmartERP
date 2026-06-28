const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
    async register(req, res, next) {
        try {
            const userData = {
                email: req.body.email,
                password: req.body.password,
                full_name: req.body.fullName || req.body.full_name
            };

            const result = await AuthService.register(userData);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            logger.error('Registration error:', error);
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            const result = await AuthService.login(email, password);
            
            res.json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            logger.error('Login error:', error);
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            const result = await AuthService.refreshToken(refreshToken);
            
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Refresh token error:', error);
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            await AuthService.logout(req.user.id);
            
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            logger.error('Logout error:', error);
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            
            await AuthService.changePassword(req.user.id, currentPassword, newPassword);
            
            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            logger.error('Change password error:', error);
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            
            await AuthService.forgotPassword(email);
            
            res.json({
                success: true,
                message: 'Password reset instructions sent to your email'
            });
        } catch (error) {
            logger.error('Forgot password error:', error);
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            
            await AuthService.resetPassword(token, newPassword);
            
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            logger.error('Reset password error:', error);
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await AuthService.getCurrentUser(req.user.id);
            
            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            logger.error('Get me error:', error);
            next(error);
        }
    }

    async verifyToken(req, res, next) {
        try {
            const { token } = req.body;
            
            const user = await AuthService.verifyToken(token);
            
            res.json({
                success: true,
                data: { user }
            });
        } catch (error) {
            logger.error('Verify token error:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();