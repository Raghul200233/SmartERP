const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}

// Admin client for backend operations
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Pool monitoring
let poolSize = 0;

const getConnection = async () => {
    poolSize++;
    console.log(`🔌 Connection pool size: ${poolSize}`);
    return supabase;
};

const releaseConnection = () => {
    poolSize--;
    console.log(`🔌 Connection pool size: ${poolSize}`);
};

module.exports = {
    supabase,
    getConnection,
    releaseConnection,
    poolSize: () => poolSize
};