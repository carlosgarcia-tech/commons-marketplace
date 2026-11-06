import {
    createAdminStatsResponseDTO,
    default as createAdminStatsResponseDTODefault,
} from '../../../../src/application/dtos/admin/AdminStatsResponseDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('AdminStatsResponseDTO', () => {
    describe('createAdminStatsResponseDTO', () => {
        it('should format stats with all fields', () => {
            const stats = {
                totalUsers: 100,
                sellers: 20,
                buyers: 80,
                totalProducts: 500,
                activeUsers: 90,
                pendingUsers: 10,
            };
            const result = createAdminStatsResponseDTO(stats);

            expect(result.totalUsers).toBe(100);
            expect(result.sellers).toBe(20);
            expect(result.buyers).toBe(80);
            expect(result.totalProducts).toBe(500);
            expect(result.activeUsers).toBe(90);
            expect(result.pendingUsers).toBe(10);
        });

        it('should default missing fields to 0', () => {
            const result = createAdminStatsResponseDTO({});
            expect(result.totalUsers).toBe(0);
            expect(result.sellers).toBe(0);
            expect(result.buyers).toBe(0);
            expect(result.totalProducts).toBe(0);
            expect(result.activeUsers).toBe(0);
            expect(result.pendingUsers).toBe(0);
        });

        it('should include timestamp', () => {
            const result = createAdminStatsResponseDTO({});
            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        });

        it('should handle partial stats', () => {
            const result = createAdminStatsResponseDTO({ totalUsers: 50 });
            expect(result.totalUsers).toBe(50);
        });
    });

    describe('default export', () => {
        it('should export same function', () => {
            expect(createAdminStatsResponseDTODefault).toBe(createAdminStatsResponseDTO);
        });
    });
});
