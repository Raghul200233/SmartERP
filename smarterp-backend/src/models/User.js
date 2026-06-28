const { supabase, pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class UserModel {
    async create(userData) {
        try {
            // Hash password
            const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            const user = {
                email: userData.email,
                password_hash: hashedPassword,
                full_name: userData.full_name,
                role: userData.role || 'USER',
                is_active: true
            };

            const { data, error } = await supabase
                .from('users')
                .insert(user)
                .select('id, email, full_name, role, is_active, created_at')
                .single();

            if (error) throw error;

            logger.info(`User created: ${data.email}`);
            return data;
        } catch (error) {
            logger.error('Error creating user:', error);
            throw error;
        }
    }

    async findByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .is('deleted_at', null)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            logger.error('Error finding user by email:', error);
            throw error;
        }
    }

    async findById(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, full_name, role, is_active, last_login, created_at')
                .eq('id', id)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding user by ID:', error);
            throw error;
        }
    }

    async update(id, userData) {
        try {
            if (userData.password) {
                const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
                userData.password_hash = await bcrypt.hash(userData.password, salt);
                delete userData.password;
            }

            const { data, error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', id)
                .is('deleted_at', null)
                .select('id, email, full_name, role, is_active, updated_at')
                .single();

            if (error) throw error;

            logger.info(`User updated: ${data.email}`);
            return data;
        } catch (error) {
            logger.error('Error updating user:', error);
            throw error;
        }
    }

    async updateLastLogin(id) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            logger.error('Error updating last login:', error);
            throw error;
        }
    }

    async softDelete(id) {
        try {
            const { error } = await supabase
                .from('users')
                .update({ 
                    deleted_at: new Date().toISOString(),
                    is_active: false 
                })
                .eq('id', id);

            if (error) throw error;

            logger.info(`User soft deleted: ${id}`);
            return true;
        } catch (error) {
            logger.error('Error soft deleting user:', error);
            throw error;
        }
    }

    async verifyPassword(user, password) {
        try {
            return await bcrypt.compare(password, user.password_hash);
        } catch (error) {
            logger.error('Error verifying password:', error);
            throw error;
        }
    }

    async getUserCompanies(userId) {
        try {
            const { data, error } = await supabase
                .from('user_companies')
                .select(`
                    role,
                    is_default,
                    companies (
                        id,
                        name,
                        address,
                        gst_number,
                        financial_year,
                        state,
                        mobile,
                        email,
                        contact_person,
                        logo_url
                    )
                `)
                .eq('user_id', userId);

            if (error) throw error;
            return data.map(item => ({
                ...item.companies,
                role: item.role,
                is_default: item.is_default
            }));
        } catch (error) {
            logger.error('Error getting user companies:', error);
            throw error;
        }
    }

    async searchUsers(searchTerm, limit = 20) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, full_name, role, is_active')
                .is('deleted_at', null)
                .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error searching users:', error);
            throw error;
        }
    }
}

module.exports = new UserModel();