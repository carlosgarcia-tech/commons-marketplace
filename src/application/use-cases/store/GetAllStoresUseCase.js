import { createStoreResponseDTO } from '../../dtos/stores/index.js';
import { log } from '../../../infrastructure/logger/logger.js';

/**
 * Use case for retrieving all approved stores (public endpoint) with pagination.
 * Optional filter by categoryId.
 * @param {object} storeRepository - The repository for store data.
 * @returns {function(object, object): Promise<object>} A function to execute the use case.
 */
export const getAllStoresUseCase = (storeRepository) => async (filters = {}, options = { page: 1, limit: 10 }) => {
    // StoreModel agrupa las categorías en categoryIds, no en categoryId
    const query = filters.categoryId ? { categoryIds: filters.categoryId } : {};

    const result = await storeRepository.findAll(query, options, { createdAt: -1 });

    const storesDTO = result.data.map((store) => createStoreResponseDTO(store));

    return {
        data: storesDTO,
        total: result.totalItems,
        page: result.currentPage,
        limit: options.limit,
        totalPages: result.totalPages,
    };
};
