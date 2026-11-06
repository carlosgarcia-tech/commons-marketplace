import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
    addToWishlistValidation,
    productIdParamValidation,
} from '../validators/wishlistValidator.js';

export const createWishlistRoutes = (wishlistController) => {
    const router = express.Router();

    router.get('/', authenticate, (req, res, next) =>
        wishlistController.getWishlist(req, res, next),
    );

    router.post('/', authenticate, addToWishlistValidation(), validate, (req, res, next) =>
        wishlistController.addToWishlist(req, res, next),
    );

    router.delete(
        '/:productId',
        authenticate,
        productIdParamValidation(),
        validate,
        (req, res, next) => wishlistController.removeFromWishlist(req, res, next),
    );

    router.get(
        '/check/:productId',
        authenticate,
        productIdParamValidation(),
        validate,
        (req, res, next) => wishlistController.checkWishlist(req, res, next),
    );

    router.delete('/', authenticate, (req, res, next) =>
        wishlistController.clearWishlist(req, res, next),
    );

    return router;
};
