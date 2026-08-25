import { body, param, query } from 'express-validator';

export const createProductValidation = () => [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isString()
        .withMessage('Product name must be a string')
        .isLength({ max: 200 })
        .withMessage('Product name must not exceed 200 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Product description is required')
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 5000 })
        .withMessage('Description must not exceed 5000 characters'),
    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .notEmpty()
        .withMessage('Stock is required')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('categoryId')
        .notEmpty()
        .withMessage('Category ID is required')
        .isString()
        .withMessage('Category ID must be a string'),
    body('subCategoryId').optional().isString().withMessage('Sub-category ID must be a string'),
    body('storeId').optional().isString().withMessage('Store ID must be a string'),
    body('storeSlug').optional().isString().withMessage('Store slug must be a string'),
];

export const updateProductValidation = () => [
    body('name')
        .optional()
        .trim()
        .isString()
        .withMessage('Product name must be a string')
        .isLength({ max: 200 })
        .withMessage('Product name must not exceed 200 characters'),
    body('description')
        .optional()
        .trim()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 5000 })
        .withMessage('Description must not exceed 5000 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('categoryId').optional().isString().withMessage('Category ID must be a string'),
    body('subCategoryId').optional().isString().withMessage('Sub-category ID must be a string'),
];

export const productIdParamValidation = () => [
    param('id')
        .notEmpty()
        .withMessage('Product ID is required')
        .isString()
        .withMessage('Product ID must be a string'),
];

// Listing endpoint: pagination only - the search term is optional here.
// Limit goes up to 1000 so the admin panel can bulk-fetch the catalog.
export const productListValidation = () => [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000'),
];

// Dedicated search endpoint: the term is the point of the request
export const productSearchValidation = () => [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search term is required')
        .isLength({ max: 200 })
        .withMessage('Search term must not exceed 200 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
];
