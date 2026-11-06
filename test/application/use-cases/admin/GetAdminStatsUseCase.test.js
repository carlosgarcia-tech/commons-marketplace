import { jest } from '@jest/globals';

jest.mock('../../../../src/infrastructure/cache/cacheManager.js', () => ({
    cacheManager: {
        get: jest.fn().mockReturnValue(null),
        set: jest.fn(),
        del: jest.fn(),
    },
    CACHE_KEYS: { ADMIN_STATS: 'admin:stats' },
    CACHE_TTL: { ADMIN_STATS: 300 },
}));

jest.mock('../../../../src/infrastructure/database/mongo/models/UserModel.js', () => ({
    default: {
        find: jest.fn().mockReturnThis(),
        lean: jest.fn(),
    },
}));

jest.mock('../../../../src/infrastructure/database/mongo/models/ProductModel.js', () => ({
    default: {
        find: jest.fn().mockReturnThis(),
        lean: jest.fn(),
    },
}));

jest.mock('../../../../src/infrastructure/database/mongo/models/StoreModel.js', () => ({
    default: {
        find: jest.fn().mockReturnThis(),
        lean: jest.fn(),
    },
}));

import { createGetAdminStatsUseCase } from '../../../../src/application/use-cases/admin/GetAdminStatsUseCase.js';
import { log } from '../../../../src/infrastructure/logger/logger.js';
import UserModel from '../../../../src/infrastructure/database/mongo/models/UserModel.js';
import ProductModel from '../../../../src/infrastructure/database/mongo/models/ProductModel.js';
import StoreModel from '../../../../src/infrastructure/database/mongo/models/StoreModel.js';
import { cacheManager } from '../../../../src/infrastructure/cache/cacheManager.js';

describe.skip('GetAdminStatsUseCase', () => {
    let getAdminStatsUseCase;

    beforeEach(() => {
        getAdminStatsUseCase = createGetAdminStatsUseCase();
        jest.clearAllMocks();
        cacheManager.get.mockReturnValue(null);
    });

    describe('execute', () => {
        it('should return admin statistics successfully', async () => {
            const mockUsers = [
                { id: 1, role: 'seller', email_confirmed_at: '2023-01-01' }, // eslint-disable-line camelcase
                { id: 2, role: 'buyer', emailConfirmedAt: '2023-01-02' },
                { id: 3, role: 'seller', email_confirmed_at: null }, // eslint-disable-line camelcase
                { id: 4, role: 'buyer', emailConfirmedAt: null },
                { id: 5, role: 'admin', email_confirmed_at: '2023-01-03' }, // eslint-disable-line camelcase
            ];

            const mockProducts = [
                { id: 1, name: 'Product 1', price: 100 },
                { id: 2, name: 'Product 2', price: 200 },
                { id: 3, name: 'Product 3', price: 300 },
            ];

            UserModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUsers) });
            ProductModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockProducts) });
            StoreModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await getAdminStatsUseCase.execute();

            expect(result).toEqual({
                totalUsers: 5,
                sellers: 2,
                buyers: 2,
                activeUsers: 3,
                pendingUsers: 2,
                totalProducts: 3,
            });

            expect(log.info).toHaveBeenCalledWith('Fetching admin statistics');
        });

        it('should handle empty users and products', async () => {
            UserModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
            ProductModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
            StoreModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await getAdminStatsUseCase.execute();

            expect(result).toEqual({
                totalUsers: 0,
                sellers: 0,
                buyers: 0,
                activeUsers: 0,
                pendingUsers: 0,
                totalProducts: 0,
            });
        });

        it('should handle users with no role', async () => {
            const mockUsers = [
                { id: 1, email_confirmed_at: '2023-01-01' }, // eslint-disable-line camelcase
                { id: 2, role: null, emailConfirmedAt: '2023-01-02' },
                { id: 3, role: '', email_confirmed_at: null }, // eslint-disable-line camelcase
            ];

            UserModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUsers) });
            ProductModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ id: 1 }]) });
            StoreModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await getAdminStatsUseCase.execute();

            expect(result.totalUsers).toBe(3);
            expect(result.sellers).toBe(0);
            expect(result.buyers).toBe(0);
        });

        it('should handle case insensitive roles', async () => {
            const mockUsers = [
                { id: 1, role: 'SELLER', email_confirmed_at: '2023-01-01' }, // eslint-disable-line camelcase
                { id: 2, role: 'Seller', emailConfirmedAt: '2023-01-02' },
                { id: 3, role: 'BUYER', email_confirmed_at: '2023-01-03' }, // eslint-disable-line camelcase
                { id: 4, role: 'Buyer', emailConfirmedAt: '2023-01-04' },
            ];

            UserModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUsers) });
            ProductModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([{ id: 1 }]) });
            StoreModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await getAdminStatsUseCase.execute();

            expect(result.sellers).toBe(2);
            expect(result.buyers).toBe(2);
        });

        it('should handle repository errors and rethrow them', async () => {
            const repositoryError = new Error('Database connection failed');
            UserModel.find.mockReturnValue({ lean: jest.fn().mockRejectedValue(repositoryError) });

            await expect(getAdminStatsUseCase.execute()).rejects.toThrow(
                'Database connection failed',
            );

            expect(log.error).toHaveBeenCalledWith(
                'Error in GetAdminStatsUseCase',
                expect.any(Object),
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle very large datasets', async () => {
            const largeUsersArray = Array.from({ length: 1000 }, (_, i) => ({
                id: i + 1,
                role: i % 3 === 0 ? 'seller' : 'buyer',
                email_confirmed_at: i % 2 === 0 ? '2023-01-01' : null, // eslint-disable-line camelcase
            }));

            const largeProductsArray = Array.from({ length: 500 }, (_, i) => ({
                id: i + 1,
                name: `Product ${i + 1}`,
            }));

            UserModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(largeUsersArray) });
            ProductModel.find.mockReturnValue({
                lean: jest.fn().mockResolvedValue(largeProductsArray),
            });
            StoreModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await getAdminStatsUseCase.execute();

            expect(result.totalUsers).toBe(1000);
            expect(result.totalProducts).toBe(500);
        });

        it('should serve from cache when available', async () => {
            const cachedData = { totalUsers: 10, totalProducts: 5 };
            cacheManager.get.mockReturnValue(cachedData);

            const result = await getAdminStatsUseCase.execute();

            expect(result).toEqual(cachedData);
            expect(UserModel.find).not.toHaveBeenCalled();
        });
    });
});
