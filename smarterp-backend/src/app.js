const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { healthCheck } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const dbStatus = await healthCheck();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        environment: process.env.NODE_ENV
    });
});

// API Routes
app.use('/api/v1/auth', require('./routes/v1/auth.routes'));
app.use('/api/v1/companies', require('./routes/v1/company.routes'));
// More routes will be added

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🔧 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
});

module.exports = app;