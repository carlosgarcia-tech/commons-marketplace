import { createReviewUseCase } from '../../../../src/application/use-cases/review/CreateReviewUseCase.js';

describe('CreateReviewUseCase', () => {
    let mockReviewRepository;
    let mockUserRepository;
    let mockProductRepository;
    let mockStoreRepository;

    beforeEach(() => {
        mockReviewRepository = {
            create: jest.fn(),
            findByUserIdAndType: jest.fn(),
        };
        mockUserRepository = {
            findById: jest.fn(),
        };
        mockProductRepository = {
            findById: jest.fn(),
        };
        mockStoreRepository = {
            findById: jest.fn(),
        };
    });

    it('should create a product review successfully when all data is valid', async () => {
        const reviewData = {
            userId: 'user123',
            type: 'product',
            productId: 'product123',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
        };

        const user = { _id: 'user123', name: 'Test User' };
        const product = { _id: 'product123', storeId: 'store123' };
        const createdReview = {
            id: 'generatedId123',
            userId: 'user123',
            type: 'product',
            productId: 'product123',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockUserRepository.findById.mockResolvedValue(user);
        mockProductRepository.findById.mockResolvedValue(product);
        mockReviewRepository.findByUserIdAndType.mockResolvedValue(null);
        mockReviewRepository.create.mockResolvedValue(createdReview);

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );
        await useCase(reviewData);

        expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
        expect(mockReviewRepository.create).toHaveBeenCalledWith({
            _id: expect.any(String),
            userId: 'user123',
            type: 'product',
            productId: 'product123',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
        });
    });

    it('should create a store review successfully when all data is valid', async () => {
        const reviewData = {
            userId: 'user123',
            type: 'store',
            storeId: 'store123',
            commentary: 'Great store!',
            score: 5,
        };

        const user = { _id: 'user123', name: 'Test User' };
        const store = { _id: 'store123', status: 'Approved' };
        const createdReview = {
            id: 'generatedId123',
            userId: 'user123',
            type: 'store',
            productId: null,
            storeId: 'store123',
            commentary: 'Great store!',
            score: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockUserRepository.findById.mockResolvedValue(user);
        mockStoreRepository.findById.mockResolvedValue(store);
        mockReviewRepository.findByUserIdAndType.mockResolvedValue(null);
        mockReviewRepository.create.mockResolvedValue(createdReview);

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );
        await useCase(reviewData);

        expect(mockReviewRepository.create).toHaveBeenCalled();
    });

    it('should throw an error when user does not exist', async () => {
        const reviewData = {
            userId: 'nonexistent-user',
            type: 'product',
            productId: 'product123',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
        };

        mockUserRepository.findById.mockResolvedValue(null);

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );

        await expect(useCase(reviewData)).rejects.toThrow('User not found');
    });

    it('should throw an error when product not found', async () => {
        const reviewData = {
            userId: 'user123',
            type: 'product',
            productId: 'nonexistent-product',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
        };

        const user = { _id: 'user123', name: 'Test User' };
        mockUserRepository.findById.mockResolvedValue(user);
        mockProductRepository.findById.mockResolvedValue(null);

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );

        await expect(useCase(reviewData)).rejects.toThrow('Product not found');
    });

    it('should throw an error when store not found for store review', async () => {
        const reviewData = {
            userId: 'user123',
            type: 'store',
            storeId: 'nonexistent-store',
            commentary: 'Great store!',
            score: 5,
        };

        const user = { _id: 'user123', name: 'Test User' };
        mockUserRepository.findById.mockResolvedValue(user);
        mockStoreRepository.findById.mockResolvedValue(null);

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );

        await expect(useCase(reviewData)).rejects.toThrow('Store not found');
    });

    it('should throw an error when user already reviewed', async () => {
        const reviewData = {
            userId: 'user123',
            type: 'product',
            productId: 'product123',
            storeId: 'store123',
            commentary: 'Great product!',
            score: 5,
        };

        const user = { _id: 'user123', name: 'Test User' };
        const product = { _id: 'product123', storeId: 'store123' };

        mockUserRepository.findById.mockResolvedValue(user);
        mockProductRepository.findById.mockResolvedValue(product);
        mockReviewRepository.findByUserIdAndType.mockResolvedValue({ id: 'existing-review' });

        const useCase = createReviewUseCase(
            mockReviewRepository,
            mockUserRepository,
            mockProductRepository,
            mockStoreRepository,
        );

        await expect(useCase(reviewData)).rejects.toThrow('You have already reviewed this product');
    });
});
