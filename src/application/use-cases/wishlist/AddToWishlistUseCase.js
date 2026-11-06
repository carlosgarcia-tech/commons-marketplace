import { log } from '../../../infrastructure/logger/logger.js';
import { ok, err } from '../../../core/either/Result.js';
import { NotFoundError, ValidationError, InfrastructureError } from '../../../core/errors/index.js';

/**
 * Use case for adding a product to a user's wishlist.
 * Validates that the product exists before adding.
 * @param {object} wishlistRepository - The repository for wishlist data.
 * @param {object} productRepository - The repository for product data.
 * @returns {Function} A function to execute the use case.
 */
export const addToWishlistUseCase =
    (wishlistRepository, productRepository) => async (userId, productId) => {
        try {
            log.info('Adding product to wishlist', { userId, productId });

            if (!productId) {
                return err(new ValidationError('Product ID is required'));
            }

            const product = await productRepository.findById(productId);
            if (!product) {
                log.warn('Product not found for wishlist', { productId });
                return err(new NotFoundError('Product not found'));
            }

            const wishlist = await wishlistRepository.addItem(userId, productId);

            log.info('Product added to wishlist', { userId, productId });

            return ok(wishlist);
        } catch (error) {
            log.error('Error in addToWishlistUseCase', {
                userId,
                productId,
                error: error.message,
                stack: error.stack,
            });
            return err(new InfrastructureError('Failed to add product to wishlist', error));
        }
    };
