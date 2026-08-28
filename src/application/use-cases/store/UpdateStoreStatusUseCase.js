import { createUpdateStoreStatusDTO, createStoreResponseDTO } from '../../dtos/stores/index.js';

/**
 * Use case for updating a store's status (admin only).
 * @param {object} storeRepository - The repository for store data.
 * @returns {function(string, object): Promise<object|null>} A function to execute the use case.
 */
export const updateStoreStatusUseCase = (storeRepository) => async (storeId, statusData) => {
    if (!storeId) {
        throw new Error('Store ID is required.');
    }

    const store = await storeRepository.findById(storeId);
    if (!store) {
        throw new Error('Store not found.');
    }

    const updateStoreStatusDTO = createUpdateStoreStatusDTO(statusData);
    const updatedStore = await storeRepository.updateStatus(
        storeId,
        updateStoreStatusDTO.status,
        updateStoreStatusDTO.reason,
    );

    return createStoreResponseDTO(updatedStore);
};
