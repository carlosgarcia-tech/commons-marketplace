jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('ClaimCouponUseCase', () => {
    it('should generate a coupon code', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result = await useCase('user123');

        expect(result).toHaveProperty('code');
        expect(result.code).toMatch(/^NB-10-[A-F0-9]{6}$/);
    });

    it('should include discount percent', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result = await useCase('user123');

        expect(result.discountPercent).toBe(10);
    });

    it('should have expiresAt date', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result = await useCase('user123');

        expect(result).toHaveProperty('expiresAt');
        const expiresDate = new Date(result.expiresAt);
        expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should include message with user id', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result = await useCase('user123');

        expect(result.message).toContain('user123');
    });

    it('should generate unique codes', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result1 = await useCase('user123');
        const result2 = await useCase('user123');

        expect(result1.code).not.toBe(result2.code);
    });

    it('should handle different user ids', async () => {
        const { claimCouponUseCase } = await import(
            '../../../../src/application/use-cases/coupon/ClaimCouponUseCase.js'
        );
        const useCase = claimCouponUseCase();
        const result1 = await useCase('user1');
        const result2 = await useCase('user2');

        expect(result1.message).toContain('user1');
        expect(result2.message).toContain('user2');
    });
});
