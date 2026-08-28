import { log } from '../../infrastructure/logger/logger.js';

/**
 * Global Error Handler Middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;

    // Map common domain error messages to appropriate HTTP status codes
    // when the error doesn't already have a statusCode (bare new Error())
    if (statusCode === 500 && err.message) {
        const msg = err.message;
        if (msg.includes('not found') || msg.includes('Not found')) {
            statusCode = 404;
        } else if (
            msg.includes('already reviewed') ||
            msg.includes('already exists') ||
            msg.includes('duplicate')
        ) {
            statusCode = 409;
        } else if (
            msg.includes('maximum limit') ||
            msg.includes('maximum of') ||
            msg.includes('exceed')
        ) {
            statusCode = 400;
        } else if (
            msg.includes('not authorized') ||
            msg.includes('not allowed') ||
            msg.includes('forbidden') ||
            msg.includes('insufficient')
        ) {
            statusCode = 403;
        } else if (
            msg.includes('required') ||
            msg.includes('invalid') ||
            msg.includes('must be') ||
            msg.includes('must not') ||
            msg.includes('is required')
        ) {
            statusCode = 400;
        } else if (msg.includes('Cannot delete') || msg.includes('has subcategories')) {
            statusCode = 409;
        }
    }

    // Unexpected failures may carry internal details (driver messages,
    // connection strings, query shapes). Respond with a generic message
    // and keep the real cause in server-side logs only.
    const clientMessage =
        statusCode >= 500 ? 'Internal server error' : err.message || 'Request failed';

    const errorResponse = {
        error: clientMessage,
        status: statusCode,
    };

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    const errorDetails = {
        message: err.message,
        status: statusCode,
        path: req.path,
        method: req.method,
        stack: err.stack,
    };

    if (statusCode >= 500) {
        log.error('Server error occurred', errorDetails);
    } else if (statusCode >= 400) {
        log.warn('Client error occurred', errorDetails);
    } else {
        log.info('Request error', errorDetails);
    }
    res.status(statusCode).json(errorResponse);
};
