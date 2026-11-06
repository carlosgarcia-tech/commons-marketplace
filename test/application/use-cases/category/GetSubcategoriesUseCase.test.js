import { getSubcategoriesUseCase } from '../../../../src/application/use-cases/category/GetSubcategoriesUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetSubcategoriesUseCase', () => {
    let mockCategoryRepository;
    let useCase;

    beforeEach(() => {
        mockCategoryRepository = {
            findSubcategories: jest.fn(),
        };
        useCase = getSubcategoriesUseCase(mockCategoryRepository);
    });

    it('should return subcategories for parent id', async () => {
        const mockCategories = [
            { _id: 'cat1', name: 'Phones' },
            { _id: 'cat2', name: 'Tablets' },
        ];
        mockCategoryRepository.findSubcategories.mockResolvedValue(mockCategories);

        const result = await useCase('parent123');

        expect(result).toHaveLength(2);
        expect(mockCategoryRepository.findSubcategories).toHaveBeenCalledWith('parent123');
    });

    it('should throw error when parentId is missing', async () => {
        await expect(useCase(null)).rejects.toThrow('Parent category ID is required');
        await expect(useCase(undefined)).rejects.toThrow('Parent category ID is required');
        await expect(useCase('')).rejects.toThrow('Parent category ID is required');
    });

    it('should return empty array when no subcategories exist', async () => {
        mockCategoryRepository.findSubcategories.mockResolvedValue([]);

        const result = await useCase('parent123');

        expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
        mockCategoryRepository.findSubcategories.mockRejectedValue(new Error('DB error'));

        await expect(useCase('parent123')).rejects.toThrow('DB error');
    });
});
