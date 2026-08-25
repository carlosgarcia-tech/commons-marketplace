import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import compression from 'compression';
import { swaggerDocs } from '../swagger/swagger.config.js';
import { getEnvironmentConfig } from '../../config/environment.js';
import { HealthCheck } from '../services/healthCheck.js';

const storage = multer.memoryStorage();

/**
 * Configure multer for file uploads
 * @description Multer configuration for image uploads
 */
export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
});

/**
 * Configure CORS options
 * @description Sets up CORS configuration based on environment
 * Supports dynamic origins from environment variable CORS_ORIGINS
 * @returns {object} CORS configuration object
 */
const getCorsOptions = () => {
    const envConfig = getEnvironmentConfig();
    const allowedOrigins = envConfig.corsOrigins;

    return {
        origin: function (origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else if (envConfig.nodeEnv === 'development') {
                callback(null, true);
            } else {
                console.warn(`CORS rejected origin: ${origin}`);
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 86400,
    };
};

/**
 * Enhanced Helmet configuration
 * @description Improved security headers configuration
 * @returns {object} Helmet configuration object
 */
const getHelmetConfig = () => {
    const envConfig = getEnvironmentConfig();

    return {
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://*.supabase.co'],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        hsts:
            envConfig.nodeEnv === 'production'
                ? {
                      maxAge: 31536000,
                      includeSubDomains: true,
                      preload: true,
                  }
                : false,
        referrerPolicy: {
            policy: 'strict-origin-when-cross-origin',
        },
    };
};

/**
 * Setup Express application
 * @description Configures Express middleware and base routes
 * @param {object} app - Express application instance
 * @returns {void}
 */
const setupExpress = (app) => {
    const envConfig = getEnvironmentConfig();
    const corsOptions = getCorsOptions();
    const helmetConfig = getHelmetConfig();

    // Must be set before any middleware that relies on req.ip (rate
    // limiting, logging). Behind a reverse proxy (nginx), Express would
    // otherwise see the proxy IP for every client and rate limit buckets
    // would be shared by the whole platform.
    app.set('trust proxy', envConfig.trustProxy);

    app.use(cors(corsOptions));

    app.use(helmet(helmetConfig));

    if (envConfig.nodeEnv === 'production') {
        app.use(compression());
    }

    if (envConfig.nodeEnv !== 'production') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    if (envConfig.enableSwagger) {
        swaggerDocs(app);
    }

    app.get('/health', async (req, res) => {
        const health = await HealthCheck.checkAll();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            status: health.status,
            timestamp: health.timestamp,
            uptime: health.uptime,
            environment: envConfig.nodeEnv,
            service: 'commons-marketplace',
            checks: health.checks,
        });
    });

    app.get('/', (req, res) => {
        // Route enumeration is information disclosure: production never
        // advertises its surface. The full map stays available outside
        // production for developer convenience.
        if (envConfig.nodeEnv === 'production') {
            return res.json({
                message: 'CommonMarketplace API Service',
                status: 'running',
            });
        }

        const endpoints = {
            health: '/health',
            auth: '/api/auth',
            users: '/api/users',
            categories: '/api/categories',
            products: '/api/products',
            chat: '/api/chat',
            reviews: '/api/reviews',
            sellerRequests: '/api/seller-requests',
            admin: '/api/admin',
        };

        if (envConfig.enableSwagger) {
            endpoints.docs = '/api-docs';
        }

        return res.json({
            message: 'CommonMarketplace API Service',
            environment: envConfig.nodeEnv,
            status: 'running',
            endpoints,
        });
    });
};

export default setupExpress;
