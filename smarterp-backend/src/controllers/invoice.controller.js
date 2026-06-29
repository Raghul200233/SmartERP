const InvoiceModel = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const PDFGenerator = require('../utils/pdfGenerator');

class InvoiceController {
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const invoiceData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoice = await InvoiceModel.create(invoiceData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'INVOICE_CREATED',
                resource_type: 'invoices',
                resource_id: invoice.id
            });

            res.status(201).json({
                success: true,
                message: 'Invoice created successfully',
                data: invoice
            });
        } catch (error) {
            logger.error('Create invoice error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create invoice'
            });
        }
    }

    async getAll(req, res, next) {
        try {
            const { companyId } = req.query;
            const filters = {
                status: req.query.status,
                invoice_type: req.query.type,
                start_date: req.query.startDate,
                end_date: req.query.endDate,
                search: req.query.search
            };

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoices = await InvoiceModel.findAll(companyId, filters);

            res.json({
                success: true,
                data: invoices,
                count: invoices.length
            });
        } catch (error) {
            logger.error('Get invoices error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch invoices'
            });
        }
    }

    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoice = await InvoiceModel.findById(id, companyId);

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            res.json({
                success: true,
                data: invoice
            });
        } catch (error) {
            logger.error('Get invoice error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch invoice'
            });
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const invoiceData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoice = await InvoiceModel.update(id, companyId, invoiceData);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'INVOICE_UPDATED',
                resource_type: 'invoices',
                resource_id: invoice.id
            });

            res.json({
                success: true,
                message: 'Invoice updated successfully',
                data: invoice
            });
        } catch (error) {
            logger.error('Update invoice error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update invoice'
            });
        }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            await InvoiceModel.softDelete(id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: 'INVOICE_DELETED',
                resource_type: 'invoices',
                resource_id: id
            });

            res.json({
                success: true,
                message: 'Invoice deleted successfully'
            });
        } catch (error) {
            logger.error('Delete invoice error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to delete invoice'
            });
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;
            const { status } = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoice = await InvoiceModel.updateStatus(id, companyId, status);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: `INVOICE_${status}`,
                resource_type: 'invoices',
                resource_id: invoice.id
            });

            res.json({
                success: true,
                message: `Invoice ${status} successfully`,
                data: invoice
            });
        } catch (error) {
            logger.error('Update invoice status error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to update invoice status'
            });
        }
    }

    async generatePDF(req, res, next) {
        try {
            const { id } = req.params;
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const invoice = await InvoiceModel.findById(id, companyId);

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            const pdfBuffer = await PDFGenerator.generateInvoicePDF(invoice);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoice_number}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            logger.error('Generate PDF error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate PDF'
            });
        }
    }

    async getStats(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const stats = await InvoiceModel.getStats(companyId, startDate, endDate);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Get invoice stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch invoice stats'
            });
        }
    }
}

module.exports = new InvoiceController();