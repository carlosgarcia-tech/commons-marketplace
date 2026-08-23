import { log } from '../../infrastructure/logger/logger.js';

/**
 * Global Error Handler Middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

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
