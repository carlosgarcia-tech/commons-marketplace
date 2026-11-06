import { createReview, updateReview } from '../../../src/core/entities/Review.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Review Entity', () => {
    describe('createReview', () => {
        it('should create a review with all provided fields', () => {
            const review = createReview({
                id: 'review123',
                userId: 'user123',
                commentary: 'Great product!',
                score: 5,
            });
            expect(review.id).toBe('review123');
            expect(review.userId).toBe('user123');
            expect(review.commentary).toBe('Great product!');
            expect(review.score).toBe(5);
        });

        it('should throw error when userId is missing', () => {
            expect(() => createReview({ commentary: 'Test', score: 5 })).toThrow(
                'Review must have a valid userId.',
            );
        });

        it('should throw error when userId is empty string', () => {
            expect(() => createReview({ userId: '', commentary: 'Test', score: 5 })).toThrow(
                'Review must have a valid userId.',
            );
        });

        it('should throw error when userId is not a string', () => {
            expect(() => createReview({ userId: 123, commentary: 'Test', score: 5 })).toThrow(
                'Review must have a valid userId.',
            );
        });

        it('should throw error when commentary is missing', () => {
            expect(() => createReview({ userId: 'user123', score: 5 })).toThrow(
                'Review must have a commentary.',
            );
        });

        it('should throw error when commentary is empty string', () => {
            expect(() => createReview({ userId: 'user123', commentary: '', score: 5 })).toThrow(
                'Review must have a commentary.',
            );
        });

        it('should throw error when score is missing', () => {
            expect(() => createReview({ userId: 'user123', commentary: 'Great!' })).toThrow(
                'Review score must be a number between 1 and 5.',
            );
        });

        it('should throw error when score is null', () => {
            expect(() =>
                createReview({ userId: 'user123', commentary: 'Great!', score: null }),
            ).toThrow('Review score must be a number between 1 and 5.');
        });

        it('should throw error when score < 1', () => {
            expect(() =>
                createReview({ userId: 'user123', commentary: 'Great!', score: 0 }),
            ).toThrow('Review score must be a number between 1 and 5.');
        });

        it('should throw error when score > 5', () => {
            expect(() =>
                createReview({ userId: 'user123', commentary: 'Great!', score: 6 }),
            ).toThrow('Review score must be a number between 1 and 5.');
        });

        it('should accept score of 1', () => {
            const review = createReview({
                userId: 'user123',
                commentary: 'Bad',
                score: 1,
            });
            expect(review.score).toBe(1);
        });

        it('should accept score of 5', () => {
            const review = createReview({
                userId: 'user123',
                commentary: 'Excellent!',
                score: 5,
            });
            expect(review.score).toBe(5);
        });

        it('should trim commentary', () => {
            const review = createReview({
                userId: 'user123',
                commentary: '  Great product!  ',
                score: 5,
            });
            expect(review.commentary).toBe('Great product!');
        });

        it('should generate id when not provided', () => {
            const review = createReview({
                userId: 'user123',
                commentary: 'Great!',
                score: 5,
            });
            expect(review.id).toBeDefined();
            expect(typeof review.id).toBe('string');
            expect(review.id.length).toBeGreaterThan(0);
        });

        it('should set createdAt and updatedAt', () => {
            const review = createReview({
                userId: 'user123',
                commentary: 'Great!',
                score: 5,
            });
            expect(review.createdAt).toBeInstanceOf(Date);
            expect(review.updatedAt).toBeInstanceOf(Date);
        });

        it('should return frozen object', () => {
            const review = createReview({
                userId: 'user123',
                commentary: 'Great!',
                score: 5,
            });
            expect(Object.isFrozen(review)).toBe(true);
        });
    });

    describe('updateReview', () => {
        let originalReview;

        beforeEach(() => {
            originalReview = createReview({
                id: 'review123',
                userId: 'user123',
                commentary: 'Original',
                score: 3,
            });
        });

        it('should update commentary', () => {
            const updated = updateReview(originalReview, { commentary: 'Updated' });
            expect(updated.commentary).toBe('Updated');
            expect(updated.score).toBe(3);
        });

        it('should update score', () => {
            const updated = updateReview(originalReview, { score: 5 });
            expect(updated.score).toBe(5);
            expect(updated.commentary).toBe('Original');
        });

        it('should update both fields', () => {
            const updated = updateReview(originalReview, {
                commentary: 'Updated',
                score: 5,
            });
            expect(updated.commentary).toBe('Updated');
            expect(updated.score).toBe(5);
        });

        it('should throw error for invalid commentary', () => {
            expect(() => updateReview(originalReview, { commentary: '' })).toThrow(
                'Commentary must be a non-empty string.',
            );
        });

        it('should throw error for invalid score', () => {
            expect(() => updateReview(originalReview, { score: 0 })).toThrow(
                'Score must be a number between 1 and 5.',
            );
        });

        it('should throw error for score > 5', () => {
            expect(() => updateReview(originalReview, { score: 10 })).toThrow(
                'Score must be a number between 1 and 5.',
            );
        });

        it('should return original review when no update data', () => {
            const updated = updateReview(originalReview, undefined);
            expect(updated).toBe(originalReview);
        });

        it('should return a new object when empty object', () => {
            const updated = updateReview(originalReview, {});
            expect(updated.id).toBe(originalReview.id);
            expect(updated.commentary).toBe(originalReview.commentary);
            expect(updated.score).toBe(originalReview.score);
            expect(updated).not.toBe(originalReview);
        });

        it('should trim new commentary', () => {
            const updated = updateReview(originalReview, { commentary: '  New  ' });
            expect(updated.commentary).toBe('New');
        });

        it('should update updatedAt timestamp', () => {
            const originalDate = originalReview.updatedAt;
            const updated = updateReview(originalReview, { commentary: 'New' });
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalDate.getTime());
        });

        it('should throw error for missing review', () => {
            expect(() => updateReview(null, {})).toThrow('Current review is required.');
        });

        it('should return frozen object', () => {
            const updated = updateReview(originalReview, { commentary: 'New' });
            expect(Object.isFrozen(updated)).toBe(true);
        });
    });
});
