import { createCategory } from '../../../src/core/entities/Category.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Category Entity', () => {
    describe('createCategory', () => {
        it('should create a category with all provided fields', () => {
            const category = createCategory({
                id: 'cat123',
                name: 'Electronics',
                description: 'Electronic devices',
                subCategories: ['Phones', 'Laptops'],
            });
            expect(category.id).toBe('cat123');
            expect(category.name).toBe('Electronics');
            expect(category.description).toBe('Electronic devices');
            expect(category.subCategories).toEqual(['Phones', 'Laptops']);
        });

        it('should handle missing optional fields', () => {
            const category = createCategory({ name: 'Electronics' });
            expect(category.id).toBeUndefined();
            expect(category.description).toBeUndefined();
            expect(category.subCategories).toBeUndefined();
        });

        it('should return frozen object', () => {
            const category = createCategory({ name: 'Electronics' });
            expect(Object.isFrozen(category)).toBe(true);
        });

        it('should handle empty subCategories array', () => {
            const category = createCategory({
                name: 'Electronics',
                subCategories: [],
            });
            expect(category.subCategories).toEqual([]);
        });

        it('should preserve undefined values for optional fields', () => {
            const data = { name: 'Test' };
            const category = createCategory(data);
            expect(category.id).toBeUndefined();
            expect(category.description).toBeUndefined();
        });

        it('should handle null subCategories', () => {
            const category = createCategory({
                name: 'Electronics',
                subCategories: null,
            });
            expect(category.subCategories).toBeNull();
        });

        it('should handle complex subCategories', () => {
            const category = createCategory({
                name: 'Electronics',
                subCategories: [
                    { id: '1', name: 'Phones' },
                    { id: '2', name: 'Tablets' },
                ],
            });
            expect(category.subCategories).toHaveLength(2);
        });
    });
});
