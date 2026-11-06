import { getAllStoresUseCase } from '../../../../src/application/use-cases/store/GetAllStoresUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetAllStoresUseCase', () => {
    let mockStoreRepository;
    let useCase;

    beforeEach(() => {
        mockStoreRepository = {
            findAll: jest.fn(),
        };
        useCase = getAllStoresUseCase(mockStoreRepository);
    });

    it('should return a paginated list of approved stores', async () => {
        const mockRepositoryResult = {
            data: [
                { _id: 'store1', storeName: 'Store 1' },
                { _id: 'store2', storeName: 'Store 2' },
            ],
            totalItems: 2,
            totalPages: 1,
            currentPage: 1,
        };
        mockStoreRepository.findAll.mockResolvedValue(mockRepositoryResult);

        const result = await useCase({}, { page: 1, limit: 10 });

        expect(mockStoreRepository.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 10 }, { createdAt: -1 });
        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(1);
    });

    it('should filter by categoryId', async () => {
        const mockRepositoryResult = {
            data: [{ _id: 'store1', storeName: 'Store 1' }],
            totalItems: 1,
            totalPages: 1,
            currentPage: 1,
        };
        mockStoreRepository.findAll.mockResolvedValue(mockRepositoryResult);

        const result = await useCase({ categoryId: 'cat123' }, { page: 1, limit: 10 });

        // StoreModel agrupa las categorías en categoryIds
        expect(mockStoreRepository.findAll).toHaveBeenCalledWith(
            { categoryIds: 'cat123' },
            { page: 1, limit: 10 },
            { createdAt: -1 },
        );
        expect(result.data).toHaveLength(1);
    });

    it('should return empty data when no stores exist', async () => {
        mockStoreRepository.findAll.mockResolvedValue({
            data: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
        });

        const result = await useCase();

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
    });

    it('should map stores to DTOs with correct properties', async () => {
        mockStoreRepository.findAll.mockResolvedValue({
            data: [{ _id: 'store1', storeName: 'Store 1' }],
            totalItems: 1,
            totalPages: 1,
            currentPage: 1,
        });

        const result = await useCase();

        expect(result.data[0]).toHaveProperty('id');
        expect(result.data[0]).toHaveProperty('storeName');
    });

    it('should handle repository errors', async () => {
        mockStoreRepository.findAll.mockRejectedValue(new Error('DB error'));

        await expect(useCase()).rejects.toThrow('DB error');
    });
});
