import { createProduct } from '../../../src/core/entities/Product.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Product Entity', () => {
    describe('createProduct', () => {
        it('should create a product with all provided fields', () => {
            const product = createProduct({
                id: 'prod123',
                name: 'Test Product',
                description: 'A great product',
                price: 100,
                stock: 10,
                categoryId: 'cat123',
                sellerId: 'seller123',
                storeId: 'store123',
                mainImageUrl: 'https://example.com/image.jpg',
                imageUrls: ['img1.jpg', 'img2.jpg'],
            });
            expect(product.id).toBe('prod123');
            expect(product.name).toBe('Test Product');
            expect(product.description).toBe('A great product');
            expect(product.price).toBe(100);
            expect(product.stock).toBe(10);
            expect(product.categoryId).toBe('cat123');
            expect(product.sellerId).toBe('seller123');
            expect(product.storeId).toBe('store123');
            expect(product.mainImageUrl).toBe('https://example.com/image.jpg');
            expect(product.imageUrls).toEqual(['img1.jpg', 'img2.jpg']);
        });

        it('should throw error when name is missing', () => {
            expect(() =>
                createProduct({
                    price: 100,
                    stock: 10,
                    storeId: 'store123',
                }),
            ).toThrow('Product name, price, and stock are required.');
        });

        it('should throw error when price is missing', () => {
            expect(() =>
                createProduct({
                    name: 'Test',
                    stock: 10,
                    storeId: 'store123',
                }),
            ).toThrow('Product name, price, and stock are required.');
        });

        it('should throw error when stock is missing', () => {
            expect(() =>
                createProduct({
                    name: 'Test',
                    price: 100,
                    storeId: 'store123',
                }),
            ).toThrow('Product name, price, and stock are required.');
        });

        it('should throw error when storeId is missing', () => {
            expect(() =>
                createProduct({
                    name: 'Test',
                    price: 100,
                    stock: 10,
                }),
            ).toThrow('Product must be associated with a store.');
        });

        it('should accept zero price', () => {
            const product = createProduct({
                name: 'Free Product',
                price: 0,
                stock: 10,
                storeId: 'store123',
            });
            expect(product.price).toBe(0);
        });

        it('should accept zero stock', () => {
            const product = createProduct({
                name: 'Out of Stock',
                price: 100,
                stock: 0,
                storeId: 'store123',
            });
            expect(product.stock).toBe(0);
        });

        it('should default imageUrls to empty array', () => {
            const product = createProduct({
                name: 'Test',
                price: 100,
                stock: 10,
                storeId: 'store123',
            });
            expect(product.imageUrls).toEqual([]);
        });

        it('should throw when price is null', () => {
            expect(() =>
                createProduct({
                    name: 'Test',
                    price: null,
                    stock: 10,
                    storeId: 'store123',
                }),
            ).toThrow('Product name, price, and stock are required.');
        });

        it('should throw when stock is null', () => {
            expect(() =>
                createProduct({
                    name: 'Test',
                    price: 100,
                    stock: null,
                    storeId: 'store123',
                }),
            ).toThrow('Product name, price, and stock are required.');
        });

        it('should handle undefined id', () => {
            const product = createProduct({
                name: 'Test',
                price: 100,
                stock: 10,
                storeId: 'store123',
            });
            expect(product.id).toBeUndefined();
        });

        it('should handle undefined description', () => {
            const product = createProduct({
                name: 'Test',
                price: 100,
                stock: 10,
                storeId: 'store123',
            });
            expect(product.description).toBeUndefined();
        });

        it('should handle all required fields with null', () => {
            const product = createProduct({
                name: 'Test',
                price: 100,
                stock: 10,
                storeId: 'store123',
            });
            expect(product.name).toBe('Test');
            expect(product.price).toBe(100);
            expect(product.stock).toBe(10);
        });
    });
});
