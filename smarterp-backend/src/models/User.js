const { supabase } = require('../config/database');

class UserModel {
    async create(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    async update(id, userData) {
        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await supabase
            .from('users')
            .update({ deleted_at: new Date() })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    }
}

module.exports = new UserModel();