const { supabase } = require('../config/database');
const logger = require('../utils/logger');

class AuditLog {
    async create(logData) {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: logData.user_id,
                    company_id: logData.company_id || null,
                    action: logData.action,
                    resource_type: logData.resource_type,
                    resource_id: logData.resource_id || null,
                    changes: logData.changes || null,
                    ip_address: logData.ip_address || null,
                    user_agent: logData.user_agent || null
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error creating audit log:', error);
            // Don't throw - audit logging shouldn't break the application
            return null;
        }
    }

    async findByUserId(userId, limit = 100) {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding audit logs:', error);
            throw error;
        }
    }

    async findByCompanyId(companyId, limit = 100) {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Error finding audit logs:', error);
            throw error;
        }
    }
}

module.exports = new AuditLog();