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
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    address: z.string().optional(),
    gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional(),
    financial_year: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid financial year format').optional(),
    state: z.string().optional(),
    mobile: z.string().regex(/^[0-9]{10}$/, 'Invalid mobile number format').optional(),
    email: z.string().email('Invalid email format').optional(),
    contact_person: z.string().optional()
});

module.exports = {
    userSchema,
    loginSchema,
    companySchema
};