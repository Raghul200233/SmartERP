const supabase = require('../config/database');
const VoucherModel = require('../models/Voucher');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');
const PDFGenerator = require('../utils/pdfGenerator');

class VoucherController {
    // ✅ Create voucher
    async create(req, res, next) {
        try {
            const { companyId } = req.query;
            const voucherData = req.body;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            // Validate voucher type
            const validTypes = await VoucherModel.getVoucherTypes();
            if (!validTypes.includes(voucherData.voucher_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid voucher type. Use PURCHASE or SALES'
                });
            }

            // Validate items
            if (!voucherData.items || voucherData.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one item is required'
                });
            }

            // Validate payment type for sales
            if (voucherData.voucher_type === 'SALES') {
                const validPayments = ['CASH', 'CARD', 'UPI'];
                if (!voucherData.payment_type || !validPayments.includes(voucherData.payment_type)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid payment type. Use CASH, CARD, or UPI'
                    });
                }
            }

            const voucher = await VoucherModel.create(voucherData, req.user.id, companyId);

            await AuditLog.create({
                user_id: req.user.id,
                company_id: companyId,
                action: `VOUCHER_${voucherData.voucher_type}_CREATED`,
                resource_type: 'vouchers',
                resource_id: voucher.id
            });

            res.status(201).json({
                success: true,
                message: `${voucherData.voucher_type} voucher created successfully`,
                data: voucher
            });
        } catch (error) {
            logger.error('Create voucher error:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Failed to create voucher'
            });
        }
    }

    async getPaymentStats(req, res, next) {
    try {
        const { companyId, startDate, endDate } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const stats = await VoucherModel.getPaymentStats(companyId, startDate, endDate);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get payment stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch payment stats'
        });
    }
}

    // ✅ Get all vouchers
async getAll(req, res, next) {
    try {
        const { companyId } = req.query;
        const filters = {
            voucher_type: req.query.type,
            status: req.query.status,
            start_date: req.query.startDate,
            end_date: req.query.endDate
        };

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        console.log('Fetching vouchers for company:', companyId, 'filters:', filters);

        const vouchers = await VoucherModel.findAll(companyId, filters);

        res.json({
            success: true,
            data: vouchers || [],
            count: vouchers?.length || 0
        });
    } catch (error) {
        console.error('Get vouchers error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch vouchers',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

    // ✅ Get voucher by ID
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

            const voucher = await VoucherModel.findById(id, companyId);

            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    message: 'Voucher not found'
                });
            }

            res.json({
                success: true,
                data: voucher
            });
        } catch (error) {
            logger.error('Get voucher error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher'
            });
        }
    }

    // ✅ Get voucher types
    async getTypes(req, res, next) {
        try {
            const types = await VoucherModel.getVoucherTypes();

            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            logger.error('Get voucher types error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher types'
            });
        }
    }

    // ✅ Get voucher stats
    async getStats(req, res, next) {
        try {
            const { companyId, startDate, endDate } = req.query;

            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: 'Company ID is required'
                });
            }

            const stats = await VoucherModel.getStats(companyId, startDate, endDate);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Get voucher stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch voucher stats'
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

        // Get voucher with details
        const voucher = await VoucherModel.findById(id, companyId);
        
        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: 'Voucher not found'
            });
        }

        // Get company details
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (companyError) throw companyError;

        // Generate PDF
        const pdfBuffer = await PDFGenerator.generateInvoice(voucher, company);

        const fileName = `Invoice-${voucher.voucher_number}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('Generate PDF error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate PDF'
        });
    }
}

async markAsPaid(req, res, next) {
    try {
        const { id } = req.params;
        const { companyId } = req.query;
        const { paymentMethod, amount } = req.body;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const voucher = await VoucherModel.markAsPaid(id, companyId, paymentMethod, amount);

        await AuditLog.create({
            user_id: req.user.id,
            company_id: companyId,
            action: 'VOUCHER_PAID',
            resource_type: 'vouchers',
            resource_id: voucher.id
        });

        res.json({
            success: true,
            message: 'Payment marked successfully',
            data: voucher
        });
    } catch (error) {
        logger.error('Mark as paid error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to mark as paid'
        });
    }
}

async getLedgerStatement(req, res, next) {
    try {
        const { id } = req.params;
        const { companyId } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required'
            });
        }

        const statement = await VoucherModel.getLedgerStatementWithPayments(id, companyId);

        res.json({
            success: true,
            data: statement
        });
    } catch (error) {
        logger.error('Get ledger statement error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch ledger statement'
        });
    }
}
}

module.exports = new VoucherController();