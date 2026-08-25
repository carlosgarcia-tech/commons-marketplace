import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isRole } from '../middlewares/authorizationMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { upload } from '../../infrastructure/web/express.js';
import * as StoreValidator from '../validators/storeValidator.js';

/**
 * Factory function to create and configure the router for store-related endpoints.
 * @param {object} storeController - The controller for store operations.
 * @param {Function} canModifyStore - Middleware to check store ownership.
 * @returns {express.Router} An Express router instance.
 */
export function createStoreRoutes(storeController, canModifyStore) {
    const router = express.Router();

    router.get('/', (req, res, next) => storeController.getAllStores(req, res, next));

    router.post(
        '/',
        authenticate,
        isRole('Seller', 'Admin'),
        uploadLimiter,
        // multer BEFORE validators: express.json() skips multipart bodies,
        // so req.body is empty until multer parses the form fields.
        upload.single('logo'),
        StoreValidator.createStoreValidation(),
        validate,
        (req, res, next) => storeController.createStore(req, res, next),
    );

    router.get('/me', authenticate, isRole('Seller', 'Admin'), (req, res, next) =>
        storeController.getMyStores(req, res, next),
    );

    router.get('/:idOrSlug', (req, res, next) => storeController.getStoreById(req, res, next));

    router.get('/:id/categories', (req, res, next) =>
        storeController.getStoreCategories(req, res, next),
    );

    router.put(
        '/:id',
        authenticate,
        isRole('Seller', 'Admin'),
        canModifyStore,
        uploadLimiter,
        // multer BEFORE validators (same multipart reason as POST)
        upload.single('logo'),
        StoreValidator.updateStoreValidation(),
        validate,
        (req, res, next) => storeController.updateStore(req, res, next),
    );

    router.delete(
        '/:id',
        authenticate,
        isRole('Seller', 'Admin'),
        canModifyStore,
        (req, res, next) => storeController.deleteStore(req, res, next),
    );

    router.get('/admin/pending', authenticate, isRole('Admin'), (req, res, next) =>
        storeController.getPendingStores(req, res, next),
    );

    router.get('/admin/status/:status', authenticate, isRole('Admin'), (req, res, next) =>
        storeController.getStoresByStatus(req, res, next),
    );

    router.patch(
        '/admin/:id/status',
        authenticate,
        isRole('Admin'),
        StoreValidator.storeStatusValidation(),
        validate,
        (req, res, next) => storeController.updateStoreStatus(req, res, next),
    );

    return router;
}
