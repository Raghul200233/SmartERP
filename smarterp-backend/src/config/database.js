const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
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
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

// Connection pool monitoring
class ConnectionPool {
    constructor() {
        this.activeConnections = 0;
        this.maxConnections = 20;
        this.queries = [];
        this.queryCount = 0;
        this.errorCount = 0;
    }

    async executeQuery(query, params = []) {
        const startTime = Date.now();
        this.activeConnections++;
        this.queryCount++;

        try {
            const result = await supabase.rpc(query, params);
            const duration = Date.now() - startTime;
            
            this.queries.push({
                query,
                duration,
                timestamp: new Date(),
                success: true
            });

            // Log slow queries
            if (duration > 1000) {
                logger.warn(`Slow query detected: ${query} took ${duration}ms`);
            }

            return result;
        } catch (error) {
            this.errorCount++;
            logger.error(`Query error: ${error.message}`, { query, error });
            throw error;
        } finally {
            this.activeConnections--;
        }
    }

    async transaction(callback) {
        try {
            // Start transaction
            await this.executeQuery('BEGIN');
            const result = await callback();
            await this.executeQuery('COMMIT');
            return result;
        } catch (error) {
            await this.executeQuery('ROLLBACK');
            throw error;
        }
    }

    getStats() {
        return {
            activeConnections: this.activeConnections,
            maxConnections: this.maxConnections,
            totalQueries: this.queryCount,
            totalErrors: this.errorCount,
            recentQueries: this.queries.slice(-10)
        };
    }
}

const pool = new ConnectionPool();

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
    pool,
    healthCheck,
    executeQuery: pool.executeQuery.bind(pool),
    transaction: pool.transaction.bind(pool)
};