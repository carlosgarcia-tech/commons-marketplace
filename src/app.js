import express from 'express';
import setupExpress from './infrastructure/web/express.js';
import { createContainer } from './infrastructure/di/container.js';
import { createAuthRoutes } from './presentation/routes/authRoutes.js';
import { createUserRoutes } from './presentation/routes/userRoutes.js';
import categoryRoutes from './presentation/routes/categoryRoutes.js';
import { createProductRoutes } from './presentation/routes/productRoutes.js';
import { createStoreRoutes } from './presentation/routes/storeRoutes.js';
import { createChatRoutes } from './presentation/routes/chatRoutes.js';
import { createWishlistRoutes } from './presentation/routes/wishlistRoutes.js';
import { createAdminRoutes } from './presentation/routes/adminRoutes.js';
import { createReviewRoutes } from './presentation/routes/reviewRoutes.js';
import { createSellerRequestRoutes } from './presentation/routes/sellerRequestRoutes.js';
import { createCouponRoutes } from './presentation/routes/couponRoutes.js';
import { createPushRoutes } from './presentation/routes/pushRoutes.js';
import { verifySupabaseConnection } from './infrastructure/supabase/config/supabaseClient.js';
import connectDB from './infrastructure/database/db.js';
import { createIndexes } from './infrastructure/database/indexes.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import { apiLimiter } from './presentation/middlewares/rateLimiter.js';
import logger from './infrastructure/logger/logger.js';
import { getEnvironmentConfig } from './config/environment.js';
import { authenticate } from './presentation/middlewares/authMiddleware.js';

const createApp = async () => {
    const app = express();
    const envConfig = getEnvironmentConfig();

    const dbConnected = await connectDB();
    if (!dbConnected) {
        throw new Error('Failed to connect to the database. Please check your configuration.');
    }
    logger.info('MongoDB connection established');

    if (envConfig.nodeEnv !== 'test') {
        await createIndexes();
    }

    const supabaseConnected = await verifySupabaseConnection();
    if (!supabaseConnected) {
        throw new Error('Failed to connect to Supabase. Please check your configuration.');
    }
    logger.info('Supabase connection established');

    if (!envConfig.ablyApiKey) {
        logger.warn('ABLY_API_KEY not configured. Chat functionality will not work.');
    } else {
        logger.info('Ably configuration found');
    }

    setupExpress(app);

    const container = createContainer();

    // Global API rate limit. Applied once for both /api/v1 and the legacy
    // /api mounts; the shared limiter instance keeps a single bucket per IP.
    // /health is intentionally left unlimited so orchestrators can probe it.
    app.use('/api', apiLimiter);

    const v1Router = express.Router();

    v1Router.use('/auth', createAuthRoutes(container.authController));
    v1Router.use('/users', createUserRoutes(container.userController));
    v1Router.use('/categories', categoryRoutes(container));
    v1Router.use(
        '/products',
        createProductRoutes(container.productController, container.canModifyProduct),
    );
    v1Router.use('/stores', createStoreRoutes(container.storeController, container.canModifyStore));
    v1Router.use(
        '/admin',
        createAdminRoutes(container.adminController, container.productController),
    );
    v1Router.use('/chat', createChatRoutes(container.chatController));
    v1Router.use('/wishlist', createWishlistRoutes(container.wishlistController));
    v1Router.use('/reviews', createReviewRoutes(container.reviewController));
    v1Router.use('/seller-requests', createSellerRequestRoutes(container.sellerRequestController));
    v1Router.use('/coupons', createCouponRoutes(container.couponController));

    app.use('/api/v1', v1Router);

    app.use('/api/auth', createAuthRoutes(container.authController));
    app.use('/api/users', createUserRoutes(container.userController));
    app.use('/api/categories', categoryRoutes(container));
    app.use(
        '/api/products',
        createProductRoutes(container.productController, container.canModifyProduct),
    );
    app.use('/api/stores', createStoreRoutes(container.storeController, container.canModifyStore));
    app.use(
        '/api/admin',
        createAdminRoutes(container.adminController, container.productController),
    );
    app.use('/api/chat', createChatRoutes(container.chatController));
    app.use('/api/wishlist', createWishlistRoutes(container.wishlistController));
    app.use('/api/reviews', createReviewRoutes(container.reviewController));
    app.use('/api/seller-requests', createSellerRequestRoutes(container.sellerRequestController));
    app.use('/api/coupons', createCouponRoutes(container.couponController));
    app.use('/api/push', authenticate, createPushRoutes());

    app.use((req, res) => {
        logger.warn('Route not found', {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });

        // Deliberately generic: listing valid routes would expose the API
        // surface to anonymous callers.
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
            method: req.method,
        });
    });

    app.use(errorHandler);

    return app;
};

export default createApp;
