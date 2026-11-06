import { getStoreCategoriesUseCase } from '../../../../src/application/use-cases/store/GetStoreCategoriesUseCase.js';
import { categoryResponseDTO } from '../../../../src/application/dtos/categories/CategoryResponseDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('GetStoreCategoriesUseCase', () => {
    let storeRepository;
    let productRepository;
    let categoryRepository;
    let useCase;

    beforeEach(() => {
        storeRepository = {
            findById: jest.fn(),
        };
        productRepository = {
            findAll: jest.fn(),
        };
        categoryRepository = {
            findById: jest.fn(),
        };
        useCase = getStoreCategoriesUseCase(storeRepository, productRepository, categoryRepository);
        jest.clearAllMocks();
    });

    it('should return categories with product counts for a store', async () => {
        const storeId = 'store123';
        const store = {
            _id: storeId,
            storeName: 'Test Store',
            categoryIds: ['cat1', 'cat2'],
        };
        storeRepository.findById.mockResolvedValue(store);
        categoryRepository.findById
            .mockResolvedValueOnce({ _id: 'cat1', name: 'Electronics', slug: 'electronics' })
            .mockResolvedValueOnce({ _id: 'cat2', name: 'Clothing', slug: 'clothing' });
        productRepository.findAll
            .mockResolvedValueOnce({ data: [{ _id: 'p1' }], totalItems: 1 })
            .mockResolvedValueOnce({ data: [{ _id: 'p2' }, { _id: 'p3' }], totalItems: 2 });

        const result = await useCase(storeId);

        expect(result.storeId).toBe(storeId);
        expect(result.storeName).toBe('Test Store');
        expect(result.categories).toHaveLength(2);
        expect(result.categories[0].productCount).toBe(1);
        expect(result.categories[1].productCount).toBe(2);
    });

    it('should throw error when store not found', async () => {
        storeRepository.findById.mockResolvedValue(null);

        await expect(useCase('nonexistent')).rejects.toThrow('Store not found');
    });

    it('should return empty categories when store has no categories', async () => {
        const store = {
            _id: 'store123',
            storeName: 'Test Store',
            categoryIds: [],
        };

        storeRepository.findById.mockResolvedValue(store);

        const result = await useCase('store123');

        expect(result.categories).toEqual([]);
    });

    it('should handle inactive categories', async () => {
        const store = {
            _id: 'store123',
            storeName: 'Test Store',
            categoryIds: ['cat1'],
        };

        storeRepository.findById.mockResolvedValue(store);
        categoryRepository.findById.mockResolvedValue(null);

        const result = await useCase('store123');

        expect(result.categories).toEqual([]);
    });
});

describe('categoryResponseDTO', () => {
    it('should create DTO with productCount', () => {
        const category = {
            _id: 'cat1',
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic products',
            parent: null,
            level: 0,
            isActive: true,
            productCount: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const dto = categoryResponseDTO(category);

        expect(dto.id).toBe('cat1');
        expect(dto.productCount).toBe(10);
    });

    it('should default productCount to 0', () => {
        const category = {
            _id: 'cat1',
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic products',
            parent: null,
            level: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const dto = categoryResponseDTO(category);

        expect(dto.productCount).toBe(0);
    });
});
