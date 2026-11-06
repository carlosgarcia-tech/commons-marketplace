import { deleteImage, deleteMultipleImages } from '../../../core/services/fileService.js';
import { createProductResponseDTO } from '../../dtos/products/index.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { ok, err } from '../../../core/either/Result.js';
import { InfrastructureError } from '../../../core/errors/index.js';
import { invalidateCache } from '../../../infrastructure/cache/cacheManager.js';

/**
 * Use case for deleting a product and its associated images.
 * @param {object} productRepository - The repository for product data.
 * @param {object} storeRepository - The repository for store data.
 * @returns {Function} A function to execute the use case.
 */
export const deleteProductUseCase =
    (productRepository, storeRepository) =>
    /**
     * Executes the delete product use case.
     * @param {string} productId - The ID of the product to delete.
     * @returns {Promise<object>} Ok with the deleted product DTO or null, or Err with an error.
     */
    async (productId) => {
        try {
            log.info('Attempting to delete product', { productId });

            const product = await productRepository.findById(productId);
            if (!product) {
                log.warn('Product not found for deletion', { productId });
                return ok(null);
            }

            const storeId = product.storeId;

            log.debug('Product found, proceeding with image deletion', {
                productId,
                hasMainImage: !!product.mainImageUrl,
                additionalImagesCount: product.imageUrls?.length || 0,
            });

            if (product.mainImageUrl) {
                try {
                    await deleteImage(product.mainImageUrl);
                    log.debug('Main image deleted successfully', { productId });
                } catch (error) {
                    log.warn('Failed to delete main image', {
                        productId,
                        error: error.message,
                        imageUrl: product.mainImageUrl,
                    });
                }
            }

            if (product.imageUrls && product.imageUrls.length > 0) {
                try {
                    await deleteMultipleImages(product.imageUrls);
                    log.debug('Additional images deleted successfully', {
                        productId,
                        count: product.imageUrls.length,
                    });
                } catch (error) {
                    log.warn('Failed to delete additional images', {
                        productId,
                        error: error.message,
                        count: product.imageUrls.length,
                    });
                }
            }

            const deletedProduct = await productRepository.deleteById(productId);

            if (storeId) {
                await storeRepository.decrementProductCount(storeId);
            }

            invalidateCache('products:');
            invalidateCache(`product:${productId}`);

            log.info('Product deleted successfully', {
                productId,
                productName: deletedProduct.name,
            });

            return ok(createProductResponseDTO(deletedProduct));
        } catch (error) {
            log.error('Error in deleteProductUseCase', {
                productId,
                error: error.message,
                stack: error.stack,
            });
            return err(
                new InfrastructureError(`Failed to delete product: ${error.message}`, error),
            );
        }
    };
