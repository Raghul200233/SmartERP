const AuthService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
    async register(req, res, next) {
        try {
            const userData = {
                email: req.body.email,
                password: req.body.password,
                full_name: req.body.fullName || req.body.full_name,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            };

            const result = await AuthService.register(userData);
            
            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please check your email for verification.',
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
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            const result = await AuthService.login(email, password, ipAddress, userAgent);
            
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
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            await AuthService.logout(req.user.id, ipAddress, userAgent);
            
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
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 8 characters'
                });
            }

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
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            const result = await AuthService.forgotPassword(email, ipAddress, userAgent);
            
            res.json({
                success: true,
                message: result.message || 'Password reset instructions sent to your email'
            });
        } catch (error) {
            logger.error('Forgot password error:', error);
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            
            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Token and new password are required'
                });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters'
                });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            await AuthService.resetPassword(token, newPassword, ipAddress, userAgent);
            
            res.json({
                success: true,
                message: 'Password reset successfully'
            });
        } catch (error) {
            logger.error('Reset password error:', error);
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        try {
            const { token } = req.body;
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification token is required'
                });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            
            await AuthService.verifyEmail(token, ipAddress, userAgent);
            
            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            logger.error('Verify email error:', error);
            next(error);
        }
    }

    async resendVerification(req, res, next) {
        try {
            const { email } = req.body;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
            }

            await AuthService.resendVerificationEmail(email);
            
            res.json({
                success: true,
                message: 'Verification email sent successfully'
            });
        } catch (error) {
            logger.error('Resend verification error:', error);
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
            
            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token is required'
                });
            }

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

    async getSession(req, res, next) {
        try {
            const session = await AuthService.getSession(req.user.id);
            
            res.json({
                success: true,
                data: session
            });
        } catch (error) {
            logger.error('Get session error:', error);
            next(error);
        }
    }
}

module.exports = new AuthController();