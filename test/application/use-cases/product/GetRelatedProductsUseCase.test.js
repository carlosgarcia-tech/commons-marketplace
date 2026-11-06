import { getRelatedProductsUseCase } from '../../../../src/application/use-cases/product/GetRelatedProductsUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('GetRelatedProductsUseCase', () => {
    let productRepository;
    let useCase;

    beforeEach(() => {
        productRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
        };
        useCase = getRelatedProductsUseCase(productRepository);
        jest.clearAllMocks();
    });

    it('should return related products from same category', async () => {
        const productId = 'product1';
        const currentProduct = {
            _id: productId,
            categoryId: 'cat1',
            name: 'Current Product',
            price: 100,
        };
        const relatedProducts = [
            {
                _id: 'product2',
                name: 'Related 1',
                price: 90,
                mainImageUrl: 'img1.jpg',
                storeId: 'store2',
                sellerId: 'seller2',
            },
            {
                _id: 'product3',
                name: 'Related 2',
                price: 110,
                mainImageUrl: 'img2.jpg',
                storeId: 'store3',
                sellerId: 'seller3',
            },
        ];

        productRepository.findById.mockResolvedValue(currentProduct);
        productRepository.findAll.mockResolvedValue({
            data: [currentProduct, ...relatedProducts],
            totalItems: 3,
        });

        const result = await useCase(productId, 10);

        expect(result.productId).toBe(productId);
        expect(result.products).toHaveLength(2);
        expect(result.products[0].name).toBe('Related 1');
    });

    it('should exclude the current product from results', async () => {
        const productId = 'product1';
        const currentProduct = {
            _id: productId,
            categoryId: 'cat1',
            name: 'Current Product',
        };

        productRepository.findById.mockResolvedValue(currentProduct);
        productRepository.findAll.mockResolvedValue({
            data: [currentProduct],
            totalItems: 1,
        });

        const result = await useCase(productId, 10);

        expect(result.products).toHaveLength(0);
    });

    it('should throw error when product not found', async () => {
        productRepository.findById.mockResolvedValue(null);

        await expect(useCase('nonexistent')).rejects.toThrow('Product not found');
    });

    it('should respect limit parameter', async () => {
        const productId = 'product1';
        const currentProduct = { _id: productId, categoryId: 'cat1' };
        const relatedProducts = [
            {
                _id: 'p2',
                name: 'R1',
                price: 90,
                mainImageUrl: 'img1.jpg',
                storeId: 's2',
                sellerId: 'sel2',
            },
            {
                _id: 'p3',
                name: 'R2',
                price: 110,
                mainImageUrl: 'img2.jpg',
                storeId: 's3',
                sellerId: 'sel3',
            },
            {
                _id: 'p4',
                name: 'R3',
                price: 120,
                mainImageUrl: 'img3.jpg',
                storeId: 's4',
                sellerId: 'sel4',
            },
        ];

        productRepository.findById.mockResolvedValue(currentProduct);
        productRepository.findAll.mockResolvedValue({
            data: [currentProduct, ...relatedProducts],
            totalItems: 4,
        });

        const result = await useCase(productId, 2);

        expect(result.products).toHaveLength(2);
    });
});
