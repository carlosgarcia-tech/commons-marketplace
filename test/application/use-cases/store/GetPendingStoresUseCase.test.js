import { getPendingStoresUseCase } from '../../../../src/application/use-cases/store/GetPendingStoresUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetPendingStoresUseCase', () => {
    let mockStoreRepository;
    let useCase;

    beforeEach(() => {
        mockStoreRepository = {
            findAllPending: jest.fn(),
        };
        useCase = getPendingStoresUseCase(mockStoreRepository);
    });

    it('should return all pending stores', async () => {
        const mockStores = [
            { _id: 'store1', status: 'Pending' },
            { _id: 'store2', status: 'Pending' },
        ];
        mockStoreRepository.findAllPending.mockResolvedValue(mockStores);

        const result = await useCase();

        expect(result).toHaveLength(2);
    });

    it('should return empty array when no pending stores', async () => {
        mockStoreRepository.findAllPending.mockResolvedValue([]);

        const result = await useCase();

        expect(result).toEqual([]);
    });

    it('should map stores to DTOs', async () => {
        const mockStores = [{ _id: 'store1' }];
        mockStoreRepository.findAllPending.mockResolvedValue(mockStores);

        const result = await useCase();

        expect(result[0]).toHaveProperty('id');
    });

    it('should handle repository errors', async () => {
        mockStoreRepository.findAllPending.mockRejectedValue(new Error('DB error'));

        await expect(useCase()).rejects.toThrow('DB error');
    });
});
