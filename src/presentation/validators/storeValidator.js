import { body, param } from 'express-validator';

export const createStoreValidation = () => [
    body('storeName')
        .trim()
        .notEmpty()
        .withMessage('Store name is required')
        .isString()
        .withMessage('Store name must be a string')
        .isLength({ max: 100 })
        .withMessage('Store name must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    body('categoryIds')
        .optional()
        .isArray({ max: 5 })
        .withMessage('A store can have a maximum of 5 categories'),
    body('seoTitle')
        .optional()
        .trim()
        .isString()
        .withMessage('SEO title must be a string')
        .isLength({ max: 70 })
        .withMessage('SEO title must not exceed 70 characters'),
    body('seoDescription')
        .optional()
        .trim()
        .isString()
        .withMessage('SEO description must be a string')
        .isLength({ max: 160 })
        .withMessage('SEO description must not exceed 160 characters'),
];

export const updateStoreValidation = () => [
    body('storeName')
        .optional()
        .trim()
        .isString()
        .withMessage('Store name must be a string')
        .isLength({ max: 100 })
        .withMessage('Store name must not exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 2000 })
        .withMessage('Description must not exceed 2000 characters'),
    body('seoTitle')
        .optional()
        .trim()
        .isString()
        .withMessage('SEO title must be a string')
        .isLength({ max: 70 })
        .withMessage('SEO title must not exceed 70 characters'),
    body('seoDescription')
        .optional()
        .trim()
        .isString()
        .withMessage('SEO description must be a string')
        .isLength({ max: 160 })
        .withMessage('SEO description must not exceed 160 characters'),
];

export const storeIdParamValidation = () => [
    param('id')
        .notEmpty()
        .withMessage('Store ID is required')
        .isString()
        .withMessage('Store ID must be a string'),
];

export const storeStatusValidation = () => [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['Pending', 'Approved', 'Rejected', 'Suspended'])
        .withMessage('Status must be one of: Pending, Approved, Rejected, Suspended'),
    body('reason').optional().trim().isString().withMessage('Reason must be a string'),
];
