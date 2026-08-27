import { createReviewController } from '../../../src/presentation/controllers/reviewController.js';

describe('ReviewController', () => {
    let controller;
    let mockDependencies;

    beforeEach(() => {
        mockDependencies = {
            resolve: jest.fn(),
        };
        controller = createReviewController(mockDependencies);
    });

    describe('createReview', () => {
        it('should create a review successfully', async () => {
            const req = {
                user: { id: 'user123' },
                body: {
                    type: 'product',
                    productId: 'product123',
                    commentary: 'Great product!',
                    score: 5,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const createdReview = {
                id: 'review123',
                userId: 'user123',
                commentary: 'Great product!',
                score: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(createdReview));

            await controller.createReview(req, res, next);

            expect(mockDependencies.resolve).toHaveBeenCalledWith('createReviewUseCase');
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Review created successfully',
                review: createdReview,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should use user id from req.user', async () => {
            const req = {
                user: { id: 'user123' },
                body: {
                    type: 'product',
                    productId: 'product123',
                    commentary: 'Great product!',
                    score: 5,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const createReviewUseCase = jest.fn().mockResolvedValue({
                id: 'review123',
                userId: 'user123',
            });

            mockDependencies.resolve.mockReturnValue(createReviewUseCase);

            await controller.createReview(req, res, next);

            expect(createReviewUseCase).toHaveBeenCalledWith({
                userId: 'user123',
                type: 'product',
                productId: 'product123',
                storeId: undefined,
                commentary: 'Great product!',
                score: 5,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error when use case throws error', async () => {
            const req = {
                user: { id: 'user123' },
                body: {
                    type: 'product',
                    productId: 'product123',
                    commentary: 'Great product!',
                    score: 5,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Database error')),
            );

            await controller.createReview(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Database error'));
        });
    });

    describe('getAllReviews', () => {
        it('should get all reviews successfully', async () => {
            const req = {
                query: {},
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const reviews = [
                {
                    id: 'review1',
                    userId: 'user1',
                    commentary: 'Great product!',
                    score: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(reviews));

            await controller.getAllReviews(req, res, next);

            expect(mockDependencies.resolve).toHaveBeenCalledWith('getAllReviewsUseCase');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Reviews retrieved successfully',
                reviews: reviews,
                count: 1,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should get reviews with filters', async () => {
            const req = {
                query: {
                    userId: 'user123',
                    score: '5',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const reviews = [
                {
                    id: 'review1',
                    userId: 'user123',
                    commentary: 'Great product!',
                    score: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(reviews));

            await controller.getAllReviews(req, res, next);

            expect(mockDependencies.resolve).toHaveBeenCalledWith('getAllReviewsUseCase');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Reviews retrieved successfully',
                reviews: reviews,
                count: 1,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error when use case throws error', async () => {
            const req = {
                query: {},
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Database error')),
            );

            await controller.getAllReviews(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Database error'));
        });
    });

    describe('getReviewById', () => {
        it('should get a review by ID successfully', async () => {
            const req = {
                params: { id: 'review123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const review = {
                id: 'review123',
                userId: 'user123',
                commentary: 'Great product!',
                score: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(review));

            await controller.getReviewById(req, res, next);

            expect(mockDependencies.resolve).toHaveBeenCalledWith('getReviewByIdUseCase');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Review retrieved successfully',
                review: review,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 when review not found', async () => {
            const req = {
                params: { id: 'review123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Review not found')),
            );

            await controller.getReviewById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Review not found',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error when use case throws error', async () => {
            const req = {
                params: { id: 'review123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Database error')),
            );

            await controller.getReviewById(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Database error'));
        });
    });

    describe('updateReview', () => {
        it('should update a review successfully', async () => {
            const req = {
                params: { id: 'review123' },
                user: { userId: 'user123' },
                body: {
                    commentary: 'Updated commentary',
                    score: 4,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            const updatedReview = {
                id: 'review123',
                userId: 'user123',
                commentary: 'Updated commentary',
                score: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(updatedReview));

            await controller.updateReview(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Review updated successfully',
                review: updatedReview,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error when use case throws error', async () => {
            const req = {
                params: { id: 'review123' },
                user: { userId: 'user123' },
                body: {
                    commentary: 'Updated commentary',
                    score: 4,
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Database error')),
            );

            await controller.updateReview(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Database error'));
        });
    });

    describe('deleteReview', () => {
        it('should delete a review successfully', async () => {
            const req = {
                params: { id: 'review123' },
                user: { userId: 'user123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(true));

            await controller.deleteReview(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Review deleted successfully',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 when review not found', async () => {
            const req = {
                params: { id: 'review123' },
                user: { userId: 'user123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(jest.fn().mockResolvedValue(false));

            await controller.deleteReview(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Review not found or not authorized to delete',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next with error when use case throws error', async () => {
            const req = {
                params: { id: 'review123' },
                user: { userId: 'user123' },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            mockDependencies.resolve.mockReturnValue(
                jest.fn().mockRejectedValue(new Error('Database error')),
            );

            await controller.deleteReview(req, res, next);

            expect(next).toHaveBeenCalledWith(new Error('Database error'));
        });
    });
});
