import { createStoreResponseDTO } from '../../dtos/stores/index.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { ok, err } from '../../../core/either/Result.js';
import { ValidationError, InfrastructureError } from '../../../core/errors/index.js';
import { invalidateCache } from '../../../infrastructure/cache/cacheManager.js';

/**
 * Use case for deleting a store by its ID.
 * Can be used by the owner or admin.
 * Also deletes all products associated with the store.
 * @param {object} storeRepository - The repository for store data.
 * @param {object} productRepository - The repository for product data.
 * @param {object} fileService - The file service for handling images.
 * @returns {Function} A function to execute the use case.
 */
export const deleteStoreUseCase =
    (storeRepository, productRepository, fileService) => async (storeId) => {
        try {
            if (!storeId) {
                log.warn('Attempted to delete store without ID');
                return err(new ValidationError('Store ID is required to delete a store.'));
            }

            log.info('Attempting to delete store', { storeId });

            const store = await storeRepository.findById(storeId);
            if (!store) {
                log.warn('Store not found for deletion', { storeId });
                return ok(null);
            }

            if (store.logo) {
                log.debug('Deleting store logo', { storeId, logo: store.logo });
                try {
                    await fileService.deleteImage(store.logo);
                    log.debug('Store logo deleted successfully', { storeId });
                } catch (error) {
                    log.warn('Could not delete store logo', {
                        storeId,
                        logo: store.logo,
                        error: error.message,
                    });
                }
            }

            const products = await productRepository.findAllByStoreId(storeId);
            log.info('Found products to delete', { storeId, productCount: products.length });

            for (const product of products) {
                try {
                    if (product.mainImageUrl) {
                        await fileService.deleteImage(product.mainImageUrl);
                    }
                    if (product.imageUrls && product.imageUrls.length > 0) {
                        await fileService.deleteMultipleImages(product.imageUrls);
                    }
                    await productRepository.deleteById(product._id);
                    log.debug('Product deleted', { productId: product._id });
                } catch (error) {
                    log.warn('Could not delete product', {
                        productId: product._id,
                        error: error.message,
                    });
                }
            }

            const deletedStore = await storeRepository.deleteById(storeId);
            log.info('Store deleted successfully', {
                storeId,
                storeName: deletedStore.storeName,
                productsDeleted: products.length,
            });

            invalidateCache('stores:');
            invalidateCache('products:');
            invalidateCache(`store:${storeId}`);

            return ok(createStoreResponseDTO(deletedStore));
        } catch (error) {
            log.error('Error in deleteStoreUseCase', {
                storeId,
                error: error.message,
                stack: error.stack,
            });
            return err(new InfrastructureError(`Failed to delete store: ${error.message}`, error));
        }
    };
