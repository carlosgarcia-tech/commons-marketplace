/**
 * Factory function to create and configure the controller for review-related operations.
 * @param {object} dependencies - The dependencies for the controller
 * @param {Function} dependencies.resolve - A function to resolve dependencies
 * @returns {object} An object with review controller methods
 */
export const createReviewController = (dependencies) => {
    return {
        /**
         * Create a new review
         * @param {object} req - Express request object
         * @param {object} res - Express response object
         * @param {Function} next - Express next function
         * @returns {object} Response with created review
         */
        createReview: async (req, res, next) => {
            try {
                const { type, productId, storeId, commentary, score } = req.body;
                const userId = req.user.id;

                const createReviewUC = dependencies.resolve('createReviewUseCase');
                const newReview = await createReviewUC({
                    userId,
                    type,
                    productId,
                    storeId,
                    commentary,
                    score,
                });

                res.status(201).json({
                    message: 'Review created successfully',
                    review: newReview,
                });
            } catch (error) {
                next(error);
            }
        },

        /**
         * Get all reviews
         * @param {object} req - Express request object
         * @param {object} res - Express response object
         * @param {Function} next - Express next function
         * @returns {object} Response with all reviews
         */
        getAllReviews: async (req, res, next) => {
            try {
                const getAllReviewsUC = dependencies.resolve('getAllReviewsUseCase');

                const filters = {
                    ...(req.query.userId && { userId: req.query.userId }),
                    ...(req.query.score && { score: parseInt(req.query.score) }),
                    ...(req.query.type && { type: req.query.type }),
                    ...(req.query.productId && { productId: req.query.productId }),
                    ...(req.query.storeId && { storeId: req.query.storeId }),
                };

                const reviews = await getAllReviewsUC(filters);

                res.status(200).json({
                    message: 'Reviews retrieved successfully',
                    reviews: reviews,
                    count: reviews.length,
                });
            } catch (error) {
                next(error);
            }
        },

        /**
         * Get a review by ID
         * @param {object} req - Express request object
         * @param {object} res - Express response object
         * @param {Function} next - Express next function
         * @returns {object} Response with a single review
         */
        getReviewById: async (req, res, next) => {
            try {
                const { id } = req.params;
                const getReviewByIdUC = dependencies.resolve('getReviewByIdUseCase');

                const review = await getReviewByIdUC(id);

                res.status(200).json({
                    message: 'Review retrieved successfully',
                    review: review,
                });
            } catch (error) {
                if (error.message === 'Review not found') {
                    return res.status(404).json({
                        error: 'Review not found',
                    });
                }
                next(error);
            }
        },

        /**
         * Update a review by ID
         * @param {object} req - Express request object
         * @param {object} res - Express response object
         * @param {Function} next - Express next function
         * @returns {object} Response with updated review
         */
        updateReview: async (req, res, next) => {
            try {
                const { id } = req.params;
                const { userId: authenticatedUserId } = req.user;
                const { commentary, score } = req.body;

                const updateReviewUC = dependencies.resolve('updateReviewUseCase');

                const updatedReview = await updateReviewUC(id, authenticatedUserId, {
                    commentary,
                    score,
                });

                res.status(200).json({
                    message: 'Review updated successfully',
                    review: updatedReview,
                });
            } catch (error) {
                if (error.message === 'Review not found') {
                    return res.status(404).json({
                        error: 'Review not found',
                    });
                }
                if (error.message === 'Not authorized to update this review') {
                    return res.status(403).json({
                        error: 'Not authorized to update this review',
                    });
                }
                next(error);
            }
        },

        /**
         * Delete a review by ID
         * @param {object} req - Express request object
         * @param {object} res - Express response object
         * @param {Function} next - Express next function
         * @returns {object} Response with deletion confirmation
         */
        deleteReview: async (req, res, next) => {
            try {
                const { id } = req.params;
                const { userId: authenticatedUserId } = req.user;

                const deleteReviewUC = dependencies.resolve('deleteReviewUseCase');

                const deleted = await deleteReviewUC(id, authenticatedUserId);

                if (!deleted) {
                    return res.status(404).json({
                        error: 'Review not found or not authorized to delete',
                    });
                }

                res.status(200).json({
                    message: 'Review deleted successfully',
                });
            } catch (error) {
                next(error);
            }
        },
    };
};
