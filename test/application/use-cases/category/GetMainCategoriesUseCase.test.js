import { getMainCategoriesUseCase } from '../../../../src/application/use-cases/category/GetMainCategoriesUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('GetMainCategoriesUseCase', () => {
    let mockCategoryRepository;
    let useCase;

    beforeEach(() => {
        mockCategoryRepository = {
            findMainCategories: jest.fn(),
        };
        useCase = getMainCategoriesUseCase(mockCategoryRepository);
    });

    it('should return main categories', async () => {
        const mockCategories = [
            { _id: 'cat1', name: 'Electronics' },
            { _id: 'cat2', name: 'Clothing' },
        ];
        mockCategoryRepository.findMainCategories.mockResolvedValue(mockCategories);

        const result = await useCase();

        expect(result).toHaveLength(2);
        expect(mockCategoryRepository.findMainCategories).toHaveBeenCalled();
    });

    it('should return empty array when no categories exist', async () => {
        mockCategoryRepository.findMainCategories.mockResolvedValue([]);

        const result = await useCase();

        expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
        mockCategoryRepository.findMainCategories.mockRejectedValue(new Error('DB error'));

        await expect(useCase()).rejects.toThrow('DB error');
    });
});
