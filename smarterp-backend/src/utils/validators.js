const { z } = require('zod');

// User validation schemas
const userSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['ADMIN', 'USER']).optional()
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

// Company validation schemas
const companySchema = z.object({
    name: z.string()
        .min(2, 'Company name must be at least 2 characters')
        .max(100, 'Company name must be less than 100 characters'),
    address: z.string()
        .max(500, 'Address must be less than 500 characters')
        .optional(),
    gst_number: z.string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
        .optional()
        .nullable(),
    financial_year: z.string()
        .regex(/^\d{4}-\d{4}$/, 'Invalid financial year format (e.g., 2024-2025)')
        .optional(),
    state: z.string()
        .max(100, 'State must be less than 100 characters')
        .optional(),
    mobile: z.string()
        .regex(/^[0-9]{10}$/, 'Invalid mobile number format (must be 10 digits)')
        .optional()
        .nullable(),
    email: z.string()
        .email('Invalid email format')
        .optional()
        .nullable(),
    contact_person: z.string()
        .max(100, 'Contact person name must be less than 100 characters')
        .optional(),
    logo_url: z.string()
        .url('Invalid URL format')
        .optional()
        .nullable()
});

// Validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error.errors) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    userSchema,
    loginSchema,
    companySchema,
    validateRequest
};