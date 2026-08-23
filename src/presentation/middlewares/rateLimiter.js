import rateLimit from 'express-rate-limit';
import { tooManyRequestsException } from '../exceptions/index.js';
import { log } from '../../infrastructure/logger/logger.js';

/**
 * Custom handler for rate limit exceeded
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next function
 * @param {object} options - Rate limit options
 */
const rateLimitHandler = (req, res, next, options) => {
    log.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
    });
    next(tooManyRequestsException(options.message));
};

/**
 * Rate limiter for authentication endpoints (login, register)
 * Stricter limits to prevent brute force attacks
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: tooManyRequestsException(
        'Demasiados intentos de autenticacion. Intente en 15 minutos',
    ),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * General API rate limiter
 * Standard limits for most endpoints
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: tooManyRequestsException('Limite de peticiones excedido. Intente mas tarde'),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * Rate limiter for file uploads
 * Fewer requests since uploads consume more resources
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: tooManyRequestsException('Limite de uploads excedido. Intente mas tarde'),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * Rate limiter for password reset requests
 * Very strict to prevent email flooding
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: tooManyRequestsException(
        'Demasiadas solicitudes de restablecimiento. Intente en 1 hora',
    ),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

/**
 * Rate limiter for chat messages
 * Allows higher frequency for real-time communication
 * @constant
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: tooManyRequestsException('Demasiados mensajes. Intente mas tarde'),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
