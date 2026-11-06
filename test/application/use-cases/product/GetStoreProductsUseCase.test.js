import { getStoreProductsUseCase } from '../../../../src/application/use-cases/product/GetStoreProductsUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetStoreProductsUseCase', () => {
    let mockProductRepository;
    let mockStoreRepository;
    let useCase;

    beforeEach(() => {
        mockProductRepository = {
            findByStoreId: jest.fn(),
        };
        mockStoreRepository = {
            findByIdOrSlug: jest.fn(),
        };
        useCase = getStoreProductsUseCase(mockProductRepository, mockStoreRepository);
    });

    it('should return products for a store', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue({ _id: 'store123' });
        mockProductRepository.findByStoreId.mockResolvedValue({
            data: [{ _id: 'prod1', name: 'Product 1' }],
            totalItems: 1,
        });

        const result = await useCase('store123');

        expect(result.data).toHaveLength(1);
        expect(mockStoreRepository.findByIdOrSlug).toHaveBeenCalledWith('store123');
    });

    it('should throw error when store not found', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue(null);

        await expect(useCase('store123')).rejects.toThrow('Store not found');
    });

    it('should return empty array when no products exist', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue({ _id: 'store123' });
        mockProductRepository.findByStoreId.mockResolvedValue({
            data: [],
            totalItems: 0,
        });

        const result = await useCase('store123');

        expect(result.data).toEqual([]);
    });

    it('should pass pagination params to repository', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue({ _id: 'store123' });
        mockProductRepository.findByStoreId.mockResolvedValue({
            data: [],
            totalItems: 0,
        });

        await useCase('store123', { page: 2, limit: 10 });

        expect(mockProductRepository.findByStoreId).toHaveBeenCalledWith(
            'store123',
            { page: 2, limit: 10 },
            {},
        );
    });

    it('should handle repository errors', async () => {
        mockStoreRepository.findByIdOrSlug.mockResolvedValue({ _id: 'store123' });
        mockProductRepository.findByStoreId.mockRejectedValue(new Error('DB error'));

        await expect(useCase('store123')).rejects.toThrow('DB error');
    });
});
