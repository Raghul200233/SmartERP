const CompanyModel = require('../models/Company');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const { companySchema } = require('../utils/validators');

class CompanyController {
    async create(req, res, next) {
        try {
            // Validate input
            const validatedData = companySchema.parse(req.body);
            
            const company = await CompanyModel.create(validatedData, req.user.id);
            
            // Log audit
            await AuditLog.create({
                user_id: req.user.id,
                company_id: company.id,
                action: 'COMPANY_CREATED',
                resource_type: 'companies',
                resource_id: company.id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.status(201).json({
                success: true,
                message: 'Company created successfully',
                data: company
            });
        } catch (error) {
            logger.error('Create company error:', error);
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const companies = await CompanyModel.findAll(req.user.id);
            
            res.json({
                success: true,
                data: companies,
                count: companies.length
            });
        } catch (error) {
            logger.error('Get companies error:', error);
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const company = await CompanyModel.findById(id, req.user.id);
            
            res.json({
                success: true,
                data: company
            });
        } catch (error) {
            logger.error('Get company error:', error);
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const company = await CompanyModel.update(id, req.user.id, updateData);
            
            // Log audit
            await AuditLog.create({
                user_id: req.user.id,
                company_id: company.id,
                action: 'COMPANY_UPDATED',
                resource_type: 'companies',
                resource_id: company.id,
                changes: updateData,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Company updated successfully',
                data: company
            });
        } catch (error) {
            logger.error('Update company error:', error);
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            
            await CompanyModel.softDelete(id, req.user.id);
            
            // Log audit
            await AuditLog.create({
                user_id: req.user.id,
                company_id: id,
                action: 'COMPANY_DELETED',
                resource_type: 'companies',
                resource_id: id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Company deleted successfully'
            });
        } catch (error) {
            logger.error('Delete company error:', error);
            next(error);
        }
    }

    async setDefault(req, res, next) {
        try {
            const { id } = req.params;
            
            const company = await CompanyModel.setDefaultCompany(req.user.id, id);
            
            // Log audit
            await AuditLog.create({
                user_id: req.user.id,
                company_id: id,
                action: 'COMPANY_SET_DEFAULT',
                resource_type: 'companies',
                resource_id: id,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.headers['user-agent']
            });

            res.json({
                success: true,
                message: 'Default company set successfully',
                data: company
            });
        } catch (error) {
            logger.error('Set default company error:', error);
            next(error);
        }
    }

    async getDefault(req, res, next) {
        try {
            const company = await CompanyModel.getDefaultCompany(req.user.id);
            
            res.json({
                success: true,
                data: company
            });
        } catch (error) {
            logger.error('Get default company error:', error);
            next(error);
        }
    }

    async getStats(req, res, next) {
        try {
            const { id } = req.params;
            const stats = await CompanyModel.getCompanyStats(id);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Get company stats error:', error);
            next(error);
        }
    }

    async search(req, res, next) {
        try {
            const { q } = req.query;
            
            if (!q) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const companies = await CompanyModel.searchCompanies(req.user.id, q);
            
            res.json({
                success: true,
                data: companies
            });
        } catch (error) {
            logger.error('Search companies error:', error);
            next(error);
        }
    }
}

module.exports = new CompanyController();