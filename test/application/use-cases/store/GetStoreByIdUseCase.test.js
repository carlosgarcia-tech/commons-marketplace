import { getStoreByIdUseCase } from '../../../../src/application/use-cases/store/GetStoreByIdUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetStoreByIdUseCase', () => {
    let mockStoreRepository;
    let useCase;

    beforeEach(() => {
        mockStoreRepository = {
            findByIdOrSlug: jest.fn(),
        };
        useCase = getStoreByIdUseCase(mockStoreRepository);
    });

    it('should return store when found', async () => {
        const mockStore = { _id: 'store123', storeName: 'My Store' };
        mockStoreRepository.findByIdOrSlug.mockResolvedValue(mockStore);

        const result = await useCase('store123');

        expect(result).toBeDefined();
        expect(mockStoreRepository.findByIdOrSlug).toHaveBeenCalledWith('store123');
    });

    it('should return null when store not found', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue(null);

        const result = await useCase('store123');

        expect(result).toBeNull();
    });

    it('should throw error when storeId is missing', async () => {
        await expect(useCase()).rejects.toThrow('Store ID or slug is required.');
        await expect(useCase(null)).rejects.toThrow('Store ID or slug is required.');
        await expect(useCase('')).rejects.toThrow('Store ID or slug is required.');
    });

    it('should map store to DTO', async () => {
        const mockStore = { _id: 'store123', storeName: 'My Store' };
        mockStoreRepository.findByIdOrSlug.mockResolvedValue(mockStore);

        const result = await useCase('store123');

        expect(result).toHaveProperty('id');
    });

    it('should handle repository errors', async () => {
        mockStoreRepository.findByIdOrSlug.mockRejectedValue(new Error('DB error'));

        await expect(useCase('store123')).rejects.toThrow('DB error');
    });
});
