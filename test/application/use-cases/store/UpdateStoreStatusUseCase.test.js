import { updateStoreStatusUseCase } from '../../../../src/application/use-cases/store/UpdateStoreStatusUseCase.js';
import {
    createUpdateStoreStatusDTO,
    createStoreResponseDTO,
} from '../../../../src/application/dtos/stores/index.js';

describe('UpdateStoreStatusUseCase Tests', () => {
    let storeRepository;
    let useCase;

    beforeEach(() => {
        storeRepository = {
            findById: jest.fn(),
            updateStatus: jest.fn(),
        };
        useCase = updateStoreStatusUseCase(storeRepository);
    });

    it('should update store status successfully', async () => {
        const storeId = 'store123';
        const statusData = { status: 'Approved' };
        const existingStore = {
            id: storeId,
            name: 'Test Store',
            status: 'Pending',
        };
        const updatedStore = {
            ...existingStore,
            status: 'Approved',
        };

        storeRepository.findById.mockResolvedValue(existingStore);
        storeRepository.updateStatus.mockResolvedValue(updatedStore);

        const result = await useCase(storeId, statusData);

        expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
        expect(storeRepository.updateStatus).toHaveBeenCalledWith(
            storeId,
            createUpdateStoreStatusDTO(statusData).status,
            createUpdateStoreStatusDTO(statusData).reason,
        );
        expect(result).toEqual(createStoreResponseDTO(updatedStore));
    });

    it('should throw error when store not found', async () => {
        const storeId = 'nonexistent';
        const statusData = { status: 'Approved' };

        storeRepository.findById.mockResolvedValue(null);

        await expect(useCase(storeId, statusData)).rejects.toThrow('Store not found.');
    });

    it('should throw error when storeId is not provided', async () => {
        const statusData = { status: 'Approved' };

        await expect(useCase(null, statusData)).rejects.toThrow('Store ID is required.');
        await expect(useCase('', statusData)).rejects.toThrow('Store ID is required.');
    });

    it('should handle repository update errors', async () => {
        const storeId = 'store123';
        const statusData = { status: 'Approved' };
        const existingStore = {
            id: storeId,
            name: 'Test Store',
            status: 'Pending',
        };
        const updateError = new Error('Update failed');

        storeRepository.findById.mockResolvedValue(existingStore);
        storeRepository.updateStatus.mockRejectedValue(updateError);

        await expect(useCase(storeId, statusData)).rejects.toThrow('Update failed');
    });

    it('should handle repository find errors', async () => {
        const storeId = 'store123';
        const statusData = { status: 'Approved' };
        const findError = new Error('Find failed');

        storeRepository.findById.mockRejectedValue(findError);

        await expect(useCase(storeId, statusData)).rejects.toThrow('Find failed');
    });
});
