import { AuthRepositoryImpl } from '../../../../src/infrastructure/supabase/repositories/AuthRepositoryImpl.js';
import supabase from '../../../../src/infrastructure/supabase/config/supabaseClient.js';
import { log } from '../../../../src/infrastructure/logger/logger.js';

jest.mock('../../../../src/infrastructure/resilience/circuitBreaker.js', () => {
    const mockExecute = jest.fn((fn) => fn());
    return {
        circuitRegistry: {
            getOrCreate: jest.fn().mockReturnValue({
                execute: mockExecute,
                getStatus: jest.fn(),
                reset: jest.fn(),
            }),
            getAllStatus: jest.fn(),
            resetAll: jest.fn(),
        },
    };
});

jest.mock('../../../../src/infrastructure/supabase/config/supabaseClient.js', () => ({
    __esModule: true,
    default: {
        auth: {
            signUp: jest.fn(),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
            getUser: jest.fn(),
        },
    },
    supabaseAdmin: {
        auth: {
            admin: {
                getUserById: jest.fn(),
            },
        },
    },
}));

describe('AuthRepositoryImpl', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('signUp', () => {
        it('should sign up a user and return data', async () => {
            const email = 'test@example.com';
            const password = 'password';
            const data = { user: { id: '123' } };
            supabase.auth.signUp.mockResolvedValue({ data, error: null });

            const result = await AuthRepositoryImpl.signUp(email, password);

            expect(supabase.auth.signUp).toHaveBeenCalledWith({ email, password, options: {} });
            expect(result).toEqual(data);
            expect(log.info).toHaveBeenCalledWith('Attempting user signup', { email });
            expect(log.info).toHaveBeenCalledWith('User signed up successfully', {
                email,
                userId: '123',
            });
        });

        it('should throw an error if signUp fails', async () => {
            const email = 'test@example.com';
            const password = 'password';
            const error = new Error('User already registered');
            supabase.auth.signUp.mockResolvedValue({ data: null, error });

            await expect(AuthRepositoryImpl.signUp(email, password)).rejects.toThrow(error.message);
            expect(log.info).toHaveBeenCalledWith('Attempting user signup', { email });
            expect(log.error).toHaveBeenCalledWith('Signup failed', {
                email,
                error: error.message,
            });
            expect(log.error).toHaveBeenCalledWith('Exception in signUp', {
                email,
                error: error.message,
            });
        });
    });

    describe('signIn', () => {
        it('should sign in a user and return data', async () => {
            const email = 'test@example.com';
            const password = 'password';
            const data = { user: { id: '123' }, session: { accessToken: 'token' } };
            supabase.auth.signInWithPassword.mockResolvedValue({ data, error: null });

            const result = await AuthRepositoryImpl.signIn(email, password);

            expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email, password });
            expect(result).toEqual(data);
            expect(log.info).toHaveBeenCalledWith('Attempting user signin', { email });
            expect(log.info).toHaveBeenCalledWith('User signed in successfully', {
                email,
                userId: '123',
            });
        });

        it('should throw an error if signIn fails with invalid credentials', async () => {
            const email = 'test@example.com';
            const password = 'wrong_password';
            const error = new Error('Invalid login credentials');
            supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error });

            await expect(AuthRepositoryImpl.signIn(email, password)).rejects.toThrow(error.message);
            expect(log.info).toHaveBeenCalledWith('Attempting user signin', { email });
            expect(log.warn).toHaveBeenCalledWith('Invalid credentials attempt', { email });
            expect(log.error).toHaveBeenCalledWith('Exception in signIn', {
                email,
                error: error.message,
            });
        });

        it('should throw an error if signIn fails with other error', async () => {
            const email = 'test@example.com';
            const password = 'password';
            const error = new Error('Some other error');
            supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error });

            await expect(AuthRepositoryImpl.signIn(email, password)).rejects.toThrow(error.message);
            expect(log.info).toHaveBeenCalledWith('Attempting user signin', { email });
            expect(log.error).toHaveBeenCalledWith('Signin failed', {
                email,
                error: error.message,
            });
            expect(log.error).toHaveBeenCalledWith('Exception in signIn', {
                email,
                error: error.message,
            });
        });
    });

    describe('signOut', () => {
        it('should sign out a user', async () => {
            const token = 'test_token';
            supabase.auth.signOut.mockResolvedValue({ error: null });

            await AuthRepositoryImpl.signOut(token);

            expect(supabase.auth.signOut).toHaveBeenCalledWith({ accessToken: token });
            expect(log.info).toHaveBeenCalledWith('Attempting user signout');
            expect(log.info).toHaveBeenCalledWith('User signed out successfully');
        });

        it('should throw an error if signOut fails', async () => {
            const token = 'invalid_token';
            const error = new Error('Invalid token');
            supabase.auth.signOut.mockResolvedValue({ error });

            await expect(AuthRepositoryImpl.signOut(token)).rejects.toThrow(error.message);
            expect(log.info).toHaveBeenCalledWith('Attempting user signout');
            expect(log.error).toHaveBeenCalledWith('Signout failed', { error: error.message });
            expect(log.error).toHaveBeenCalledWith('Exception in signOut', {
                error: error.message,
            });
        });
    });

    describe('getUser', () => {
        it('should get a user and return user data', async () => {
            const token = 'test_token';
            const user = { id: '123' };
            supabase.auth.getUser.mockResolvedValue({ data: { user }, error: null });

            const result = await AuthRepositoryImpl.getUser(token);

            expect(supabase.auth.getUser).toHaveBeenCalledWith(token);
            expect(result).toEqual(user);
            expect(log.debug).toHaveBeenCalledWith('Fetching user from token');
            expect(log.debug).toHaveBeenCalledWith('User retrieved successfully', {
                userId: '123',
            });
        });

        it('should throw an error if getUser fails', async () => {
            const token = 'invalid_token';
            const error = new Error('Invalid token');
            supabase.auth.getUser.mockResolvedValue({ data: null, error });

            await expect(AuthRepositoryImpl.getUser(token)).rejects.toThrow(error.message);
            expect(log.debug).toHaveBeenCalledWith('Fetching user from token');
            expect(log.error).toHaveBeenCalledWith('Get user failed', { error: error.message });
            expect(log.error).toHaveBeenCalledWith('Exception in getUser', {
                error: error.message,
            });
        });
    });

    describe('getUserById', () => {
        it('should use the admin client to fetch a user by id', async () => {
            const { supabaseAdmin } = await import(
                '../../../../src/infrastructure/supabase/config/supabaseClient.js'
            );
            const userData = { user: { id: 'user-123' } };
            supabaseAdmin.auth.admin.getUserById.mockResolvedValue({ data: userData, error: null });

            const result = await AuthRepositoryImpl.getUserById('user-123');

            expect(supabaseAdmin.auth.admin.getUserById).toHaveBeenCalledWith('user-123');
            expect(result).toEqual(userData);
        });

        it('should throw an error when the admin lookup fails', async () => {
            const { supabaseAdmin } = await import(
                '../../../../src/infrastructure/supabase/config/supabaseClient.js'
            );
            const error = new Error('User not found');
            supabaseAdmin.auth.admin.getUserById.mockResolvedValue({ data: null, error });

            await expect(AuthRepositoryImpl.getUserById('missing-id')).rejects.toThrow(
                'Failed to get user: User not found',
            );
        });
    });
});
