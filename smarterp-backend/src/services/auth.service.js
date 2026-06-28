const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require('../models/User');
const CompanyModel = require('../models/Company');
const AuditLog = require('../models/AuditLog');
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

        // Create user
        const user = await UserModel.create(validatedData);
        
        // Generate tokens
        const tokens = this.generateTokens(user);
        
        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'USER_REGISTERED',
            resource_type: 'users',
            resource_id: user.id
        });

        return {
            user,
            ...tokens
        };
    }

    async login(email, password) {
        // Validate input
        const validatedData = loginSchema.parse({ email, password });

        // Find user
        const user = await UserModel.findByEmail(validatedData.email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Account is deactivated');
        }

        // Verify password
        const isValid = await UserModel.verifyPassword(user, validatedData.password);
        if (!isValid) {
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
            resource_id: user.id
        });

        // Remove sensitive data
        delete user.password_hash;
        delete user.deleted_at;

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

    async logout(userId) {
        // Log audit
        await AuditLog.create({
            user_id: userId,
            action: 'USER_LOGOUT',
            resource_type: 'users',
            resource_id: userId
        });

        // Invalidate token (in a real app, add token to blacklist)
        return { success: true };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isValid = await UserModel.verifyPassword(
            await UserModel.findByEmail(user.email),
            currentPassword
        );
        
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

    async forgotPassword(email) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not
            return { success: true };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        // Save reset token to user
        await UserModel.update(user.id, {
            reset_token: resetToken,
            reset_token_expiry: new Date(resetTokenExpiry).toISOString()
        });

        // In production, send email with reset link
        // For now, just log the token
        logger.info(`Password reset token for ${email}: ${resetToken}`);

        // Log audit
        await AuditLog.create({
            user_id: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            resource_type: 'users',
            resource_id: user.id
        });

        return { success: true };
    }

    async resetPassword(token, newPassword) {
        // Find user with reset token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_token', token)
            .gt('reset_token_expiry', new Date().toISOString())
            .single();

        if (error || !user) {
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
            resource_id: user.id
        });

        return { success: true };
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded.id);
            
            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error('Token verification error:', error);
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
}

module.exports = new AuthService();