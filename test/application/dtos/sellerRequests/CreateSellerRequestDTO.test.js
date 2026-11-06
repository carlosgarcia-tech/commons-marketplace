import { createSellerRequestDTO } from '../../../../src/application/dtos/sellerRequests/CreateSellerRequestDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('CreateSellerRequestDTO', () => {
    it('should create DTO with message', () => {
        const result = createSellerRequestDTO({ message: 'I want to sell' });
        expect(result.message).toBe('I want to sell');
    });

    it('should default message to empty string', () => {
        const result = createSellerRequestDTO({});
        expect(result.message).toBe('');
    });

    it('should handle null message', () => {
        const result = createSellerRequestDTO({ message: null });
        expect(result.message).toBe('');
    });

    it('should handle undefined message', () => {
        const result = createSellerRequestDTO({ message: undefined });
        expect(result.message).toBe('');
    });

    it('should preserve existing fields', () => {
        const result = createSellerRequestDTO({ message: 'Test', extra: 'field' });
        expect(result.message).toBe('Test');
    });
});
