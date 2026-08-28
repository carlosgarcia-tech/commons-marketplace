import { body, param } from 'express-validator';

export const addToWishlistValidation = () => [
    body('productId')
        .trim()
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Product ID must be a valid ObjectId'),
];

export const productIdParamValidation = () => [
    param('productId')
        .trim()
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Product ID must be a valid ObjectId'),
];
