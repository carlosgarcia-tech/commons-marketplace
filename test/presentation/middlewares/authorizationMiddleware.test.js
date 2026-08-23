import {
    isRole,
    createIsProductOwnerOrAdmin,
    isAdmin,
    canModifyUser,
} from '../../../src/presentation/middlewares/authorizationMiddleware.js';
import { forbiddenException } from '../../../src/presentation/exceptions/forbiddenException.js';

describe('Authorization Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            user: {},
            params: {},
        };
        res = {};
        next = jest.fn();
    });

    describe('isRole', () => {
        it('should call next if user has the required role', () => {
            req.user.app_metadata = { role: 'admin' }; // eslint-disable-line camelcase
            const middleware = isRole('Admin', 'Seller');
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with a forbidden exception if user does not have the required role', () => {
            req.user.app_metadata = { role: 'buyer' }; // eslint-disable-line camelcase
            const middleware = isRole('Admin', 'Seller');
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Insufficient permissions.'));
        });

        it('should default to buyer when user role is not defined', () => {
            const middleware = isRole('buyer');
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with a forbidden exception if user role is not defined and admin required', () => {
            const middleware = isRole('Admin');
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Insufficient permissions.'));
        });

        it('should ignore self-assigned roles in user_metadata to prevent privilege escalation', () => {
            req.user.user_metadata = { role: 'admin' }; // eslint-disable-line camelcase
            req.user.raw_user_meta_data = { role: 'admin' }; // eslint-disable-line camelcase
            req.user.role = 'admin';
            const middleware = isRole('Admin');
            middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Insufficient permissions.'));
        });
    });

    describe('createIsProductOwnerOrAdmin', () => {
        let getProductByIdUseCase;
        let middleware;

        beforeEach(() => {
            getProductByIdUseCase = jest.fn();
            middleware = createIsProductOwnerOrAdmin(getProductByIdUseCase);
        });

        it('should call next if user is an Admin', async () => {
            req.user = { id: 'user_id', app_metadata: { role: 'admin' } }; // eslint-disable-line camelcase
            req.params.productId = 'product_id';
            getProductByIdUseCase.mockResolvedValue({ sellerId: 'owner_id' });
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next if user is the product owner', async () => {
            req.user = { id: 'owner_id', app_metadata: { role: 'seller' } }; // eslint-disable-line camelcase
            req.params.productId = 'product_id';
            getProductByIdUseCase.mockResolvedValue({ sellerId: 'owner_id' });
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with a forbidden exception if user is not the owner or an admin', async () => {
            req.user = { id: 'user_id', app_metadata: { role: 'buyer' } }; // eslint-disable-line camelcase
            req.params.productId = 'product_id';
            getProductByIdUseCase.mockResolvedValue({ sellerId: 'owner_id' });
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(
                forbiddenException('You are not allowed to modify this product.'),
            );
        });

        it('should call next with an error if getProductByIdUseCase throws an error', async () => {
            const error = new Error('Product not found');
            req.user = { id: 'user_id', app_metadata: { role: 'buyer' } }; // eslint-disable-line camelcase
            req.params.productId = 'product_id';
            getProductByIdUseCase.mockRejectedValue(error);
            await middleware(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('isAdmin', () => {
        it('should call next if user is an Admin', () => {
            req.user = { app_metadata: { role: 'admin' } }; // eslint-disable-line camelcase
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with a forbidden exception if user is not an Admin', () => {
            req.user = { app_metadata: { role: 'buyer' } }; // eslint-disable-line camelcase
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Admin access only.'));
        });

        it('should call next with a forbidden exception if user role is not defined', () => {
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Admin access only.'));
        });

        it('should not grant admin from user_metadata even if it says admin', () => {
            req.user = {
                app_metadata: {}, // eslint-disable-line camelcase
                user_metadata: { role: 'admin' }, // eslint-disable-line camelcase
            };
            isAdmin(req, res, next);
            expect(next).toHaveBeenCalledWith(forbiddenException('Admin access only.'));
        });
    });

    describe('canModifyUser', () => {
        it('should call next when user modifies their own profile', () => {
            req.user = { id: 'user-123', app_metadata: { role: 'buyer' } }; // eslint-disable-line camelcase
            req.params.id = 'user-123';

            canModifyUser(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should call next when admin modifies another user', () => {
            req.user = { id: 'admin-1', app_metadata: { role: 'admin' } }; // eslint-disable-line camelcase
            req.params.id = 'user-123';

            canModifyUser(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should call next with forbidden exception when modifying another user', () => {
            req.user = { id: 'attacker-1', app_metadata: { role: 'buyer' } }; // eslint-disable-line camelcase
            req.params.id = 'victim-1';

            canModifyUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                forbiddenException('You are not allowed to modify this user.'),
            );
        });

        it('should not grant access from user_metadata admin role', () => {
            req.user = {
                id: 'attacker-1',
                app_metadata: {}, // eslint-disable-line camelcase
                user_metadata: { role: 'admin' }, // eslint-disable-line camelcase
            };
            req.params.id = 'victim-1';

            canModifyUser(req, res, next);

            expect(next).toHaveBeenCalledWith(
                forbiddenException('You are not allowed to modify this user.'),
            );
        });

        it('should call next with error when an unexpected error occurs', () => {
            req.user = undefined;
            Object.defineProperty(req, 'params', {
                get() {
                    throw new Error('boom');
                },
            });

            canModifyUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
