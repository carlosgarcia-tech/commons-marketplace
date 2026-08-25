import { authenticate } from '../../../src/presentation/middlewares/authMiddleware.js';
import supabase from '../../../src/infrastructure/supabase/config/supabaseClient.js';
import { UserRepositoryImpl } from '../../../src/infrastructure/database/mongo/repositories/userRepository.js';
import { unauthorizedException } from '../../../src/presentation/exceptions/unauthorizedException.js';

jest.mock('../../../src/infrastructure/supabase/config/supabaseClient.js', () => ({
    auth: {
        getUser: jest.fn(),
    },
}));

jest.mock('../../../src/infrastructure/database/mongo/repositories/userRepository.js', () => ({
    UserRepositoryImpl: {
        findById: jest.fn(),
    },
}));

describe('Authenticate Middleware Tests', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {
                authorization: 'Bearer valid-token',
            },
        };
        res = {};
        next = jest.fn();

        UserRepositoryImpl.findById.mockReset();
    });

    it('should call next with user and mongo profile if token is valid', async () => {
        const mockUser = { id: '123', email: 'test@mail.com' };
        const mockProfile = { _id: '123', role: 'admin' };

        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        UserRepositoryImpl.findById.mockResolvedValue(mockProfile);

        await authenticate(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(req.mongoUser).toEqual(mockProfile);
        expect(next).toHaveBeenCalledWith();
    });

    it('should still authenticate when the mongo profile is missing', async () => {
        const mockUser = { id: '123', email: 'test@mail.com' };

        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        UserRepositoryImpl.findById.mockResolvedValue(null);

        await authenticate(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(req.mongoUser).toBeNull();
        expect(next).toHaveBeenCalledWith();
    });

    it('should still authenticate when the mongo lookup fails', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockUser = { id: '123', email: 'test@mail.com' };

        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null,
        });
        UserRepositoryImpl.findById.mockRejectedValue(new Error('db down'));

        await authenticate(req, res, next);

        expect(req.user).toEqual(mockUser);
        expect(req.mongoUser).toBeNull();
        expect(next).toHaveBeenCalledWith();
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('should call next with unauthorizedException if token is missing', async () => {
        req.headers.authorization = undefined;

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(unauthorizedException('Token missing'));
    });

    it('should call next with unauthorizedException if Supabase returns error', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: null,
            error: { message: 'Invalid token' },
        });

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(unauthorizedException('Invalid or expired token'));
    });

    it('should call next with unauthorizedException if user is not returned', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: {},
            error: null,
        });

        await authenticate(req, res, next);

        expect(next).toHaveBeenCalledWith(unauthorizedException('Invalid or expired token'));
    });
});
