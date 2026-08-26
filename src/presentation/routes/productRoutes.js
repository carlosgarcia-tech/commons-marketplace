import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { isRole } from '../middlewares/authorizationMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';
import { upload } from '../../infrastructure/web/express.js';
import * as ProductValidator from '../validators/productValidator.js';

/**
 * Factory function to create and configure the router for product-related endpoints.
 * @param {object} productController - The controller for product operations.
 * @param {Function} canModifyProduct - Middleware to check product modification permissions.
 * @returns {express.Router} An Express router instance.
 */
export function createProductRoutes(productController, canModifyProduct) {
    const router = express.Router();

    router.get('/', ProductValidator.productListValidation(), validate, (req, res, next) =>
        productController.getAllProducts(req, res, next),
    );

    router.get('/store/:storeIdOrSlug', (req, res, next) =>
        productController.getStoreProducts(req, res, next),
    );

    router.get('/search', ProductValidator.productSearchValidation(), validate, (req, res, next) =>
        productController.searchProducts(req, res, next),
    );

    router.get('/:idOrSlug', (req, res, next) => productController.getProductById(req, res, next));

    router.get('/:id/related', (req, res, next) =>
        productController.getRelatedProducts(req, res, next),
    );

    router.post(
        '/',
        authenticate,
        isRole('Seller', 'Admin'),
        uploadLimiter,
        // multer BEFORE validators: express.json() skips multipart bodies,
        // so req.body is empty until the files middleware parses the form.
        upload.fields([
            { name: 'mainImage', maxCount: 1 },
            { name: 'additionalImages', maxCount: 5 },
        ]),
        ProductValidator.createProductValidation(),
        validate,
        (req, res, next) => productController.createProduct(req, res, next),
    );

    router.put(
        '/:id',
        authenticate,
        isRole('Seller', 'Admin'),
        canModifyProduct,
        uploadLimiter,
        // multer BEFORE validators (same multipart reason as POST)
        upload.fields([
            { name: 'mainImage', maxCount: 1 },
            { name: 'additionalImages', maxCount: 5 },
        ]),
        ProductValidator.updateProductValidation(),
        validate,
        (req, res, next) => productController.updateProduct(req, res, next),
    );

    router.delete(
        '/:id',
        authenticate,
        isRole('Seller', 'Admin'),
        canModifyProduct,
        (req, res, next) => productController.deleteProduct(req, res, next),
    );

    return router;
}
