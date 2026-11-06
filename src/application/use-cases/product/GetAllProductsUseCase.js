import { createProductResponseDTO } from '../../dtos/products/ProductResponseDTO.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { cacheManager, CACHE_TTL } from '../../../infrastructure/cache/cacheManager.js';
import { withRetry } from '../../../infrastructure/resilience/retry.js';

/**
 * Factory function to create the getAllProducts use case.
 * @param {object} productRepository - The product repository.
 * @returns {Function} The getAllProducts use case function.
 */
export function getAllProductsUseCase(productRepository) {
    /**
     * Get all products with optional filters and pagination.
     * @param {object} filters - Optional filters (storeId, categoryId, subCategoryId, status, etc.)
     * @param {object} options - Pagination options { page, limit }
     * @param {object} sort - Sort options { field: 1 or -1 }
     * @returns {Promise<object>} Paginated result with products as DTOs
     */
    return async function getAllProducts(
        filters = {},
        options = { page: 1, limit: 10 },
        sort = {},
    ) {
        const cacheKey = `products:${JSON.stringify(filters)}:${options.page}:${options.limit}:${JSON.stringify(sort)}`;

        try {
            log.debug('Fetching all products', {
                filters,
                page: options.page,
                limit: options.limit,
                sort,
            });

            const cached = cacheManager.get(cacheKey);
            if (cached !== null) {
                log.debug('Products fetched from cache', { cacheKey });
                return cached;
            }

            const cleanFilters = {};

            if (filters.storeId) cleanFilters.storeId = filters.storeId;
            if (filters.categoryId) cleanFilters.categoryId = filters.categoryId;
            if (filters.subCategoryId) cleanFilters.subCategoryId = filters.subCategoryId;
            if (filters.status) cleanFilters.status = filters.status;

            log.debug('Applied filters', { cleanFilters });

            const result = await withRetry(
                () => productRepository.findAll(cleanFilters, options, sort),
                { maxRetries: 2, retryDelay: 500 },
            );

            const productsDTO = result.data.map((product) => createProductResponseDTO(product));

            const response = {
                data: productsDTO,
                total: result.totalItems,
                page: options.page,
                limit: options.limit,
                totalPages: result.totalPages,
            };

            cacheManager.set(cacheKey, response, CACHE_TTL.PRODUCTS);

            log.info('Products fetched successfully', {
                totalItems: result.totalItems,
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                productsCount: productsDTO.length,
            });

            return response;
        } catch (error) {
            log.error('Error in getAllProducts use case', {
                error: error.message,
                stack: error.stack,
                filters,
                options,
            });
            throw error;
        }
    };
}
