import { createProductResponseDTO } from '../../dtos/products/index.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { withRetry } from '../../../infrastructure/resilience/retry.js';

/**
 * Factory function to create the searchProducts use case.
 * @param {object} productRepository - The product repository.
 * @returns {Function} The searchProducts use case function.
 */
export function searchProductsUseCase(productRepository) {
    /**
     * Search products by term with optional filters and pagination.
     * @param {string} searchTerm - The text to match against name/description/categories.
     * @param {object} filters - Optional filters (categoryId, subCategoryId, etc.).
     * @param {object} options - Pagination options { page, limit }.
     * @param {object} sort - Sort options { field: 1 or -1 }.
     * @returns {Promise<object>} Paginated search result with products as DTOs.
     */
    return async function searchProducts(
        searchTerm,
        filters = {},
        options = { page: 1, limit: 10 },
        sort = {},
    ) {
        try {
            log.debug('Searching products', { searchTerm, filters, options, sort });

            const result = await withRetry(
                () => productRepository.searchProducts(searchTerm, filters, options, sort),
                { maxRetries: 2, retryDelay: 500 },
            );

            const productsDTO = result.data.map((product) => createProductResponseDTO(product));

            return {
                products: productsDTO,
                pagination: {
                    totalItems: result.totalItems,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                    itemsPerPage: options.limit,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage,
                },
            };
        } catch (error) {
            log.error('Error in searchProducts use case', {
                error: error.message,
                stack: error.stack,
                searchTerm,
                filters,
                options,
            });
            throw error;
        }
    };
}
