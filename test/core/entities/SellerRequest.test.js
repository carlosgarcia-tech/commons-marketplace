import { createSellerRequestEntity } from '../../../src/core/entities/SellerRequest.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('SellerRequest Entity', () => {
    describe('createSellerRequestEntity', () => {
        it('should create a seller request with all provided fields', () => {
            const request = createSellerRequestEntity({
                id: 'req123',
                userId: 'user123',
                status: 'approved',
                message: 'I want to sell my products',
                adminComment: 'Approved',
            });
            expect(request.id).toBe('req123');
            expect(request.userId).toBe('user123');
            expect(request.status).toBe('approved');
            expect(request.message).toBe('I want to sell my products');
            expect(request.adminComment).toBe('Approved');
        });

        it('should set default status to pending', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
            });
            expect(request.status).toBe('pending');
        });

        it('should set default message to empty string', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
            });
            expect(request.message).toBe('');
        });

        it('should set default adminComment to empty string', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
            });
            expect(request.adminComment).toBe('');
        });

        it('should accept _id as alternative to id', () => {
            const request = createSellerRequestEntity({
                _id: 'req123',
                userId: 'user123',
            });
            expect(request.id).toBe('req123');
        });

        it('should preserve timestamps', () => {
            const createdAt = new Date();
            const updatedAt = new Date();
            const request = createSellerRequestEntity({
                userId: 'user123',
                createdAt,
                updatedAt,
            });
            expect(request.createdAt).toBe(createdAt);
            expect(request.updatedAt).toBe(updatedAt);
        });

        it('should handle all status values', () => {
            expect(createSellerRequestEntity({ userId: '1', status: 'pending' }).status).toBe(
                'pending',
            );
            expect(createSellerRequestEntity({ userId: '2', status: 'approved' }).status).toBe(
                'approved',
            );
            expect(createSellerRequestEntity({ userId: '3', status: 'rejected' }).status).toBe(
                'rejected',
            );
        });

        it('should handle empty message', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
                message: '',
            });
            expect(request.message).toBe('');
        });

        it('should handle empty adminComment', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
                adminComment: '',
            });
            expect(request.adminComment).toBe('');
        });

        it('should convert null status to default', () => {
            const request = createSellerRequestEntity({
                userId: 'user123',
                status: null,
            });
            expect(request.status).toBe('pending');
        });
    });
});
