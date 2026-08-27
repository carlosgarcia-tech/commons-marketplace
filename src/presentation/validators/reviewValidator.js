import { body, param } from 'express-validator';

/**
 * Validation rules for creating a review
 * @returns {Array} Array of express-validator validation rules
 */
export const createReviewValidation = () => [
    body('type')
        .notEmpty()
        .withMessage('Review type is required')
        .isIn(['product', 'store'])
        .withMessage('Review type must be either product or store'),
    body('productId')
        .if(body('type').equals('product'))
        .notEmpty()
        .withMessage('Product ID is required for product reviews')
        .isMongoId()
        .withMessage('Product ID must be a valid ObjectId'),
    body('storeId')
        .if(body('type').equals('store'))
        .notEmpty()
        .withMessage('Store ID is required for store reviews')
        .isMongoId()
        .withMessage('Store ID must be a valid ObjectId'),
    body('commentary')
        .notEmpty()
        .withMessage('Commentary is required')
        .isString()
        .withMessage('Commentary must be a string')
        .isLength({ max: 1000 })
        .withMessage('Commentary must not exceed 1000 characters'),
    body('score')
        .notEmpty()
        .withMessage('Score is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Score must be an integer between 1 and 5'),
];

/**
 * Validation rules for updating a review
 * @returns {Array} Array of express-validator validation rules
 */
export const updateReviewValidation = () => [
    body('commentary')
        .optional()
        .isString()
        .withMessage('Commentary must be a string')
        .isLength({ max: 1000 })
        .withMessage('Commentary must not exceed 1000 characters'),
    body('score')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Score must be an integer between 1 and 5'),
];

/**
 * Validation rules for review ID parameter
 * @returns {Array} Array of express-validator validation rules
 */
export const reviewIdParamValidation = () => [
    param('id')
        .notEmpty()
        .withMessage('Review ID is required')
        .isString()
        .withMessage('Review ID must be a string'),
];
