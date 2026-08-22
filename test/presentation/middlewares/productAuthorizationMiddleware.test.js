import { createCanModifyProduct } from '../../../src/presentation/middlewares/productAuthorizationMiddleware.js';

describe('ProductAuthorizationMiddleware Tests', () => {
    let getProductByIdUseCase;
    let storeRepository;
    let middleware;
    let req;
    let res;
    let next;

    beforeEach(() => {
        getProductByIdUseCase = jest.fn();
        storeRepository = {
            findById: jest.fn(),
        };
        middleware = createCanModifyProduct(getProductByIdUseCase, storeRepository);

        req = {
            params: { id: 'product123' },
            user: { id: 'user123', app_metadata: { role: 'buyer' } }, // eslint-disable-line camelcase
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    it('should allow admin users to modify any product', async () => {
        req.user.app_metadata = { role: 'admin' }; // eslint-disable-line camelcase

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(getProductByIdUseCase).not.toHaveBeenCalled();
        expect(storeRepository.findById).not.toHaveBeenCalled();
    });

    it('should allow store owner to modify product from approved store', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const store = {
            id: 'store123',
            userId: 'user123',
            status: 'Approved',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(getProductByIdUseCase).toHaveBeenCalledWith('product123');
        expect(storeRepository.findById).toHaveBeenCalledWith('store123');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 404 when product not found', async () => {
        getProductByIdUseCase.mockResolvedValue(null);

        await middleware(req, res, next);

        expect(getProductByIdUseCase).toHaveBeenCalledWith('product123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 when associated store not found', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(null);

        await middleware(req, res, next);

        expect(storeRepository.findById).toHaveBeenCalledWith('store123');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Associated store not found' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not store owner', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const store = {
            id: 'store123',
            userId: 'different-user',
            status: 'Approved',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message:
                'You do not have permission to modify this product. Only the store owner can modify products.',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when store is not approved', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const store = {
            id: 'store123',
            userId: 'user123',
            status: 'Pending',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message:
                'Cannot modify products for a store with status: Pending. Store must be Approved.',
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should handle store with rejected status', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const store = {
            id: 'store123',
            userId: 'user123',
            status: 'Rejected',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message:
                'Cannot modify products for a store with status: Rejected. Store must be Approved.',
        });
    });

    it('should handle store with suspended status', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const store = {
            id: 'store123',
            userId: 'user123',
            status: 'Suspended',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message:
                'Cannot modify products for a store with status: Suspended. Store must be Approved.',
        });
    });

    it('should handle errors from getProductByIdUseCase', async () => {
        const error = new Error('Database error');
        getProductByIdUseCase.mockRejectedValue(error);

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle errors from storeRepository', async () => {
        const product = {
            id: 'product123',
            storeId: 'store123',
        };
        const error = new Error('Store database error');

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockRejectedValue(error);

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('should work with different product and store IDs', async () => {
        req.params.id = 'product456';
        const product = {
            id: 'product456',
            storeId: 'store789',
        };
        const store = {
            id: 'store789',
            userId: 'user123',
            status: 'Approved',
        };

        getProductByIdUseCase.mockResolvedValue(product);
        storeRepository.findById.mockResolvedValue(store);

        await middleware(req, res, next);

        expect(getProductByIdUseCase).toHaveBeenCalledWith('product456');
        expect(storeRepository.findById).toHaveBeenCalledWith('store789');
        expect(next).toHaveBeenCalled();
    });
});
