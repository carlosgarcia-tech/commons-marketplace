import { createCreateStoreDTO, createStoreResponseDTO } from '../../dtos/stores/index.js';
import { forbiddenException, notFoundException } from '../../../presentation/exceptions/index.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { invalidateCache } from '../../../infrastructure/cache/cacheManager.js';

/**
 * Use case for creating a new store.
 * Users can create a maximum of 2 stores.
 * Requires user to be approved as seller.
 * @param {object} storeRepository - The repository for store data.
 * @param {object} userRepository - The repository for user data.
 * @param {object} categoryRepository - The repository for category data.
 * @param {object} fileService - The file service for handling images.
 * @returns {function(object, object): Promise<object>} A function to execute the use case.
 */
export const createStoreUseCase =
    (storeRepository, userRepository, categoryRepository, fileService) =>
    async (storeData, file = null) => {
        log.info('Creating new store', { userId: storeData.userId });

        const user = await userRepository.findById(storeData.userId);
        if (!user) {
            throw notFoundException('User not found');
        }

        if (user.role !== 'seller' && user.role !== 'admin') {
            log.warn('User is not a seller or admin', {
                userId: storeData.userId,
                role: user.role,
            });
            throw forbiddenException('You must be an approved seller to create a store.');
        }

        const storeCount = await storeRepository.countByUserId(storeData.userId);
        if (storeCount >= 2) {
            throw new Error('User has reached the maximum limit of 2 stores.');
        }

        if (storeData.categoryIds && storeData.categoryIds.length > 5) {
            throw new Error('A store can have a maximum of 5 categories.');
        }

        if (storeData.categoryIds && storeData.categoryIds.length > 0) {
            for (const categoryId of storeData.categoryIds) {
                const category = await categoryRepository.findById(categoryId);
                if (!category || !category.isActive) {
                    throw new Error(`Category not found or inactive: ${categoryId}`);
                }
            }
        }

        let logoUrl = null;
        if (file) {
            logoUrl = await fileService.uploadImage(file, {
                folder: 'stores',
                prefix: 'logo',
            });
        }

        const createStoreDTO = createCreateStoreDTO({
            ...storeData,
            logo: logoUrl,
            productCount: 0,
        });

        const newStore = await storeRepository.create(createStoreDTO);
        log.info('Store created successfully', { storeId: newStore._id });

        invalidateCache('stores:');
        invalidateCache('products:');

        return createStoreResponseDTO(newStore);
    };
