jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('HealthCheck Service', () => {
    it('should perform health check', async () => {
        const { HealthCheck } = await import('../../../src/infrastructure/services/healthCheck.js');
        const result = await HealthCheck.checkAll();
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('timestamp');
    });
});

describe('Bcrypt Password Hasher', () => {
    const bcrypt = require('../../../src/infrastructure/services/bcryptPasswordHasher.js');

    it('should hash a password', async () => {
        const password = 'testPassword123';
        const hash = await bcrypt.hashPassword(password);
        expect(hash).toBeDefined();
        expect(hash).not.toBe(password);
    });

    it('should verify correct password', async () => {
        const password = 'testPassword123';
        const hash = await bcrypt.hashPassword(password);
        const isValid = await bcrypt.verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
        const password = 'testPassword123';
        const wrongPassword = 'wrongPassword';
        const hash = await bcrypt.hashPassword(password);
        const isValid = await bcrypt.verifyPassword(wrongPassword, hash);
        expect(isValid).toBe(false);
    });
});
