import { createCanModifyStore } from '../../../src/presentation/middlewares/storeAuthorizationMiddleware.js';

describe('StoreAuthorizationMiddleware Tests', () => {
    let storeRepository;
    let middleware;
    let req;
    let res;
    let next;

    beforeEach(() => {
        storeRepository = {
            findById: jest.fn(),
        };
        middleware = createCanModifyStore(storeRepository);

        req = {
            params: { id: 'store123' },
            user: { id: 'user123', app_metadata: { role: 'buyer' } }, // eslint-disable-line camelcase
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should allow admin users to modify any store', async () => {
        req.user.app_metadata = { role: 'admin' }; // eslint-disable-line camelcase

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(storeRepository.findById).not.toHaveBeenCalled();
    });

    it('should allow store owner to modify their store', async () => {
        const store = {
            id: 'store123',
            userId: 'user123',
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(storeRepository.findById).toHaveBeenCalledWith('store123');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when store not found', async () => {
        storeRepository.findById.mockResolvedValue(null);

        await middleware(req, res, next);

        expect(storeRepository.findById).toHaveBeenCalledWith('store123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Store not found.' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not store owner', async () => {
        const store = {
            id: 'store123',
            userId: 'different-user',
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'You do not have permission to modify this store.',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should handle different store IDs', async () => {
        req.params.id = 'store456';
        const store = {
            id: 'store456',
            userId: 'user123',
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(storeRepository.findById).toHaveBeenCalledWith('store456');
        expect(next).toHaveBeenCalled();
    });

    it('should handle different user IDs', async () => {
        req.user.id = 'user456';
        const store = {
            id: 'store123',
            userId: 'user456',
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
        const error = new Error('Database error');
        storeRepository.findById.mockRejectedValue(error);

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('should work with different admin roles', async () => {
        req.user.app_metadata = { role: 'Admin' }; // eslint-disable-line camelcase

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(storeRepository.findById).not.toHaveBeenCalled();
    });

    it('should handle empty store ID', async () => {
        req.params.id = '';

        const store = {
            id: '',
            userId: 'user123',
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(storeRepository.findById).toHaveBeenCalledWith('');
        expect(next).toHaveBeenCalled();
    });

    it('should handle store with null userId', async () => {
        const store = {
            id: 'store123',
            userId: null,
        };

        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'You do not have permission to modify this store.',
        });
    });
});
