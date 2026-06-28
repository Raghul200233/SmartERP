const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase } = require('../config/database');
const UserModel = require('../models/User');
const CompanyModel = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const EmailService = require('../utils/email');
const logger = require('../utils/logger');
const { userSchema, loginSchema } = require('../utils/validators');

class AuthService {
    async register(userData) {
        // Validate input
        const validatedData = userSchema.parse(userData);
        
        // Check if user exists
        const existingUser = await UserModel.findByEmail(validatedData.email);
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user with verification token
        const user = await UserModel.create({
            ...validatedData,
            verification_token: verificationToken,
            verification_token_expiry: verificationTokenExpiry.toISOString()
        });

        // Send verification email (if enabled)
        if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
            await EmailService.sendVerificationEmail(user.email, verificationToken);
        }

        // Generate tokens
        const tokens = this.generateTokens(user);
        
        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'USER_REGISTERED',
            resource_type: 'users',
            resource_id: user.id,
            ip_address: userData.ip_address || null,
            user_agent: userData.user_agent || null
        });

        // Remove sensitive data
        delete user.password_hash;

        return {
            user,
            ...tokens
        };
    }

    async login(email, password, ipAddress = null, userAgent = null) {
        // Validate input
        const validatedData = loginSchema.parse({ email, password });

        // Find user
        const user = await UserModel.findByEmail(validatedData.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is deactivated. Please contact support.');
        }

        // Check if email is verified (if verification is enabled)
        if (process.env.ENABLE_EMAIL_VERIFICATION === 'true' && !user.email_verified) {
            throw new Error('Please verify your email before logging in');
        }

        // Verify password
        const isValid = await UserModel.verifyPassword(user, validatedData.password);
        if (!isValid) {
            // Log failed attempt
            await AuditLog.create({
                user_id: user.id,
                action: 'LOGIN_FAILED',
                resource_type: 'users',
                resource_id: user.id,
                ip_address: ipAddress,
                user_agent: userAgent
            });
            throw new Error('Invalid credentials');
        }

        // Update last login
        await UserModel.updateLastLogin(user.id);

        // Get user's companies
        const companies = await UserModel.getUserCompanies(user.id);

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'USER_LOGIN',
            resource_type: 'users',
            resource_id: user.id,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        // Remove sensitive data
        delete user.password_hash;
        delete user.deleted_at;
        delete user.verification_token;
        delete user.verification_token_expiry;
        delete user.reset_token;
        delete user.reset_token_expiry;

        return {
            user: {
                ...user,
                companies
            },
            ...tokens
        };
    }

    generateTokens(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        const refreshToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
        );

        return { accessToken, refreshToken };
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded.id);
            
            if (!user) {
                throw new Error('User not found');
            }

            const tokens = this.generateTokens(user);
            
            // Log audit
            await AuditLog.create({
                user_id: user.id,
                action: 'TOKEN_REFRESHED',
                resource_type: 'users',
                resource_id: user.id
            });

            return tokens;
        } catch (error) {
            logger.error('Refresh token error:', error);
            throw new Error('Invalid refresh token');
        }
    }

    async logout(userId, ipAddress = null, userAgent = null) {
        // Log audit
        await AuditLog.create({
            user_id: userId,
            action: 'USER_LOGOUT',
            resource_type: 'users',
            resource_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        // Invalidate token (in a real app, add token to blacklist)
        return { success: true };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get full user with password hash
        const fullUser = await UserModel.findByEmail(user.email);
        if (!fullUser) {
            throw new Error('User not found');
        }

        // Verify current password
        const isValid = await UserModel.verifyPassword(fullUser, currentPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        await UserModel.update(userId, { password: newPassword });

        // Log audit
        await AuditLog.create({
            user_id: userId,
            action: 'PASSWORD_CHANGED',
            resource_type: 'users',
            resource_id: userId
        });

        return { success: true };
    }

    async forgotPassword(email, ipAddress = null, userAgent = null) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return { success: true, message: 'If an account exists, a reset link has been sent' };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Save reset token to user
        await UserModel.update(user.id, {
            reset_token: resetToken,
            reset_token_expiry: resetTokenExpiry.toISOString()
        });

        // Send reset email
        await EmailService.sendPasswordResetEmail(email, resetToken);

        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            resource_type: 'users',
            resource_id: user.id,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        return { success: true, message: 'If an account exists, a reset link has been sent' };
    }

    async resetPassword(token, newPassword, ipAddress = null, userAgent = null) {
        const user = await UserModel.findByResetToken(token);
        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        // Update password and clear reset token
        await UserModel.update(user.id, {
            password: newPassword,
            reset_token: null,
            reset_token_expiry: null
        });

        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'PASSWORD_RESET_COMPLETED',
            resource_type: 'users',
            resource_id: user.id,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        return { success: true };
    }

    async verifyEmail(token, ipAddress = null, userAgent = null) {
        const user = await UserModel.findByVerificationToken(token);
        if (!user) {
            throw new Error('Invalid or expired verification token');
        }

        // Verify email
        await UserModel.verifyEmail(user.id);

        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'EMAIL_VERIFIED',
            resource_type: 'users',
            resource_id: user.id,
            ip_address: ipAddress,
            user_agent: userAgent
        });

        return { success: true };
    }

    async resendVerificationEmail(email) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        if (user.email_verified) {
            throw new Error('Email already verified');
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await UserModel.update(user.id, {
            verification_token: verificationToken,
            verification_token_expiry: verificationTokenExpiry.toISOString()
        });

        // Send verification email
        await EmailService.sendVerificationEmail(email, verificationToken);

        return { success: true };
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded.id);
            
            if (!user) {
                throw new Error('User not found');
            }

            if (!user.is_active) {
                throw new Error('Account is deactivated');
            }

            return user;
        } catch (error) {
            logger.error('Token verification error:', error);
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw new Error('Invalid token');
        }
    }

    async getCurrentUser(userId) {
        const user = await UserModel.findById(userId);
        const companies = await UserModel.getUserCompanies(userId);
        
        return {
            ...user,
            companies
        };
    }

    async getSession(userId) {
        const user = await this.getCurrentUser(userId);
        return {
            user,
            session: {
                id: userId,
                created_at: new Date().toISOString()
            }
        };
    }

    async validateSession(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded.id);
            
            if (!user || !user.is_active) {
                return null;
            }

            return user;
        } catch (error) {
            return null;
        }
    }
}

module.exports = new AuthService();