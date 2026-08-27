import { CreateReviewDTO, ReviewResponseDTO } from '../../dtos/review/ReviewDTO.js';
import { createReview } from '../../../core/entities/Review.js';
import { log } from '../../../infrastructure/logger/logger.js';

export const createReviewUseCase =
    (reviewRepository, userRepository, productRepository, storeRepository) =>
    async (reviewData) => {
        log.info('Creating new review', { userId: reviewData.userId, type: reviewData.type });

        const createReviewDTO = CreateReviewDTO.from(reviewData);

        const user = await userRepository.findById(createReviewDTO.userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (createReviewDTO.type === 'product') {
            const product = await productRepository.findById(createReviewDTO.productId);
            if (!product) {
                throw new Error('Product not found');
            }
        }

        if (createReviewDTO.type === 'store') {
            const store = await storeRepository.findById(createReviewDTO.storeId);
            if (!store) {
                throw new Error('Store not found');
            }
            if (store.status !== 'Approved') {
                throw new Error('Cannot review a store that is not approved');
            }
        }

        const existingReview = await reviewRepository.findByUserIdAndType(
            createReviewDTO.userId,
            createReviewDTO.type,
            createReviewDTO.type === 'product'
                ? createReviewDTO.productId
                : createReviewDTO.storeId,
        );
        if (existingReview) {
            throw new Error('You have already reviewed this ' + createReviewDTO.type);
        }

        const reviewEntity = createReview({
            userId: createReviewDTO.userId,
            commentary: createReviewDTO.commentary,
            score: createReviewDTO.score,
        });

        const reviewToSave = {
            _id: reviewEntity.id,
            userId: reviewEntity.userId,
            type: createReviewDTO.type,
            productId: createReviewDTO.productId,
            storeId: createReviewDTO.storeId,
            commentary: reviewEntity.commentary,
            score: reviewEntity.score,
            createdAt: reviewEntity.createdAt,
            updatedAt: reviewEntity.updatedAt,
        };

        const savedReview = await reviewRepository.create(reviewToSave);
        log.info('Review created successfully', { reviewId: savedReview._id });

        return ReviewResponseDTO.from(savedReview);
    };
