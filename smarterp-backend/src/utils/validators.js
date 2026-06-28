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
        .optional()
        .nullable()
        .default(null),
    gst_number: z.string()
        .optional()
        .nullable()
        .default(null),
    financial_year: z.string()
        .optional()
        .nullable()
        .default(null),
    state: z.string()
        .max(100, 'State must be less than 100 characters')
        .optional()
        .nullable()
        .default(null),
    mobile: z.string()
        .optional()
        .nullable()
        .default(null),
    email: z.string()
        .email('Invalid email format')
        .optional()
        .nullable()
        .default(null),
    contact_person: z.string()
        .max(100, 'Contact person name must be less than 100 characters')
        .optional()
        .nullable()
        .default(null),
    logo_url: z.string()
        .url('Invalid URL format')
        .optional()
        .nullable()
        .default(null)
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