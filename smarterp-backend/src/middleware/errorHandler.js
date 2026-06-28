const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code === 'PGRST116') {
        // Supabase not found
        statusCode = 404;
        message = 'Resource not found';
    } else if (err.code === 'PGRST205') {
        // Supabase duplicate
        statusCode = 409;
        message = 'Resource already exists';
    }

    // Log error
    logger.error(`${statusCode} - ${message}`, {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        user: req.user?.id,
        stack: err.stack
    });

    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details
        })
    });
};

module.exports = errorHandler;