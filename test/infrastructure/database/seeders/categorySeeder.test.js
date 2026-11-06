import { seedCategories } from '../../../../src/infrastructure/database/seeders/categorySeeder.js';
import CategoryModel from '../../../../src/infrastructure/database/mongo/models/CategoryModel.js';

jest.mock('../../../../src/infrastructure/database/mongo/models/CategoryModel.js', () => ({
    countDocuments: jest.fn(),
    insertMany: jest.fn(),
}));

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('CategorySeeder', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('seedCategories', () => {
        it('should skip seeding if categories already exist', async () => {
            CategoryModel.countDocuments.mockResolvedValue(5);

            await seedCategories();

            expect(CategoryModel.countDocuments).toHaveBeenCalled();
            expect(CategoryModel.insertMany).not.toHaveBeenCalled();
        });

        it('should seed categories when none exist', async () => {
            CategoryModel.countDocuments.mockResolvedValue(0);
            CategoryModel.insertMany
                .mockResolvedValueOnce([
                    { _id: 'cat1', slug: 'electronics' },
                    { _id: 'cat2', slug: 'clothing' },
                ])
                .mockResolvedValueOnce([]);

            await seedCategories();

            expect(CategoryModel.insertMany).toHaveBeenCalledTimes(2);
        });

        it('should handle errors and throw', async () => {
            CategoryModel.countDocuments.mockRejectedValue(new Error('Database error'));

            await expect(seedCategories()).rejects.toThrow('Database error');
        });
    });
});
