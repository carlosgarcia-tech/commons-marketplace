import { updateSellerRequestStatusDTO } from '../../../../src/application/dtos/sellerRequests/UpdateSellerRequestStatusDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('UpdateSellerRequestStatusDTO', () => {
    it('should create DTO with status', () => {
        const result = updateSellerRequestStatusDTO({ status: 'approved' });
        expect(result.status).toBe('approved');
    });

    it('should default adminComment to empty string', () => {
        const result = updateSellerRequestStatusDTO({ status: 'approved' });
        expect(result.adminComment).toBe('');
    });

    it('should use custom adminComment', () => {
        const result = updateSellerRequestStatusDTO({
            status: 'rejected',
            adminComment: 'Not qualified',
        });
        expect(result.adminComment).toBe('Not qualified');
    });

    it('should handle empty adminComment', () => {
        const result = updateSellerRequestStatusDTO({ status: 'rejected', adminComment: '' });
        expect(result.adminComment).toBe('');
    });

    it('should handle all status values', () => {
        expect(updateSellerRequestStatusDTO({ status: 'pending' }).status).toBe('pending');
        expect(updateSellerRequestStatusDTO({ status: 'approved' }).status).toBe('approved');
        expect(updateSellerRequestStatusDTO({ status: 'rejected' }).status).toBe('rejected');
    });
});
