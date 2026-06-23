const { supabase } = require('../config/database');

class CompanyModel {
    async create(companyData) {
        const { data, error } = await supabase
            .from('companies')
            .insert(companyData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findAll() {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .is('deleted_at', null);
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByUserId(userId) {
        const { data, error } = await supabase
            .from('user_companies')
            .select(`
                company_id,
                role,
                is_default,
                companies (*)
            `)
            .eq('user_id', userId);
        
        if (error) throw error;
        return data;
    }

    async update(id, companyData) {
        const { data, error } = await supabase
            .from('companies')
            .update(companyData)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async softDelete(id) {
        const { error } = await supabase
            .from('companies')
            .update({ deleted_at: new Date() })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    }

    async getUserCompanies(userId) {
        const { data, error } = await supabase
            .from('user_companies')
            .select(`
                company_id,
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
        return data;
    }
}

module.exports = new CompanyModel();