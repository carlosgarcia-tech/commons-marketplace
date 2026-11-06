import { log } from '../../../infrastructure/logger/logger.js';

/**
 * Use case for getting related products.
 * Returns products from the same category, excluding the current product.
 * Shows products from other sellers as well.
 * @param {object} productRepository - The repository for product data.
 * @returns {Function} A function to execute the use case.
 */
export const getRelatedProductsUseCase =
    (productRepository) =>
    async (productId, limit = 10) => {
        log.info('Getting related products', { productId, limit });

        const currentProduct = await productRepository.findById(productId);
        if (!currentProduct) {
            throw new Error('Product not found');
        }

        const filters = {
            categoryId: currentProduct.categoryId.toString(),
            status: 'Active',
        };

        const sort = { createdAt: -1 };

        const result = await productRepository.findAll(
            filters,
            { page: 1, limit: limit + 1 },
            sort,
        );

        const relatedProducts = (result.data || [])
            .filter((p) => p._id.toString() !== productId)
            .slice(0, limit)
            .map((p) => ({
                id: p._id,
                name: p.name,
                price: p.price,
                mainImageUrl: p.mainImageUrl,
                storeId: p.storeId,
                sellerId: p.sellerId,
            }));

        log.info('Related products fetched successfully', {
            productId,
            count: relatedProducts.length,
        });

        return {
            productId,
            categoryId: currentProduct.categoryId,
            products: relatedProducts,
        };
    };
