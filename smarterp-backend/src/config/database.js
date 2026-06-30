const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials. Please check your .env file');
}

// Service client (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'public'
    }
});

// Anonymous client (for public operations)
const supabaseAnon = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
}) : null;

// Health check
const healthCheck = async () => {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
        logger.error('Database health check failed:', error);
        return { status: 'unhealthy', error: error.message };
    }
};

module.exports = {
    supabase,
    supabaseAnon,
    healthCheck
};