import {
    sellerRequestResponseDTO,
    sellerRequestListResponseDTO,
} from '../../../../src/application/dtos/sellerRequests/SellerRequestResponseDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('SellerRequestResponseDTO', () => {
    const baseRequest = {
        id: 'req123',
        userId: 'user123',
        status: 'pending',
        message: 'I want to sell',
        adminComment: '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it('should format request with id', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.id).toBe('req123');
    });

    it('should handle _id as alternative', () => {
        const req = { _id: 'req456', userId: 'u1', status: 'pending' };
        const result = sellerRequestResponseDTO(req);
        expect(result.id).toBe('req456');
    });

    it('should include userId', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.userId).toBe('user123');
    });

    it('should include status', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.status).toBe('pending');
    });

    it('should include message', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.message).toBe('I want to sell');
    });

    it('should include adminComment', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.adminComment).toBe('');
    });

    it('should include timestamps', () => {
        const result = sellerRequestResponseDTO(baseRequest);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });
});

describe('sellerRequestListResponseDTO', () => {
    it('should map array of requests', () => {
        const requests = [
            { id: '1', userId: 'u1', status: 'pending' },
            { id: '2', userId: 'u2', status: 'approved' },
        ];
        const result = sellerRequestListResponseDTO(requests);
        expect(result).toHaveLength(2);
    });

    it('should handle empty array', () => {
        const result = sellerRequestListResponseDTO([]);
        expect(result).toEqual([]);
    });
});
