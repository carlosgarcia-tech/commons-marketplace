import { body, param } from 'express-validator';
import {
    createReviewValidation,
    updateReviewValidation,
    reviewIdParamValidation,
} from '../../../src/presentation/validators/reviewValidator.js';

jest.mock('express-validator', () => {
    const mockChain = {
        notEmpty: jest.fn().mockReturnThis(),
        isString: jest.fn().mockReturnThis(),
        isInt: jest.fn().mockReturnThis(),
        isLength: jest.fn().mockReturnThis(),
        isMongoId: jest.fn().mockReturnThis(),
        isIn: jest.fn().mockReturnThis(),
        optional: jest.fn().mockReturnThis(),
        withMessage: jest.fn().mockReturnThis(),
        if: jest.fn().mockReturnThis(),
        equals: jest.fn().mockReturnThis(),
    };

    return {
        body: jest.fn().mockReturnValue(mockChain),
        param: jest.fn().mockReturnValue(mockChain),
        validationResult: jest.fn().mockReturnValue({
            isEmpty: () => true,
            array: () => [],
        }),
    };
});

describe('ReviewValidator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createReviewValidation', () => {
        it('should validate type field', () => {
            const validations = createReviewValidation();

            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('type');
            expect(body).toHaveBeenCalledTimes(7);
        });

        it('should validate productId field', () => {
            const validations = createReviewValidation();

            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('productId');
        });

        it('should validate storeId field', () => {
            const validations = createReviewValidation();

            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('storeId');
        });

        it('should validate commentary field', () => {
            const validations = createReviewValidation();

            // Execute the validation chain
            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            // Verify that all fields were validated
            expect(body).toHaveBeenCalledWith('commentary');
        });

        it('should validate score field', () => {
            const validations = createReviewValidation();

            // Execute the validation chain
            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('score');
        });
    });

    describe('updateReviewValidation', () => {
        it('should validate commentary field as optional', () => {
            const validations = updateReviewValidation();

            // Execute the validation chain
            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('commentary');
        });

        it('should validate score field as optional', () => {
            const validations = updateReviewValidation();

            // Execute the validation chain
            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(body).toHaveBeenCalledWith('score');
        });
    });

    describe('reviewIdParamValidation', () => {
        it('should validate review ID parameter', () => {
            const validations = reviewIdParamValidation();

            // Execute the validation chain
            validations.forEach((validation) => {
                if (typeof validation === 'function') {
                    validation();
                }
            });

            expect(param).toHaveBeenCalledWith('id');
        });
    });
});
