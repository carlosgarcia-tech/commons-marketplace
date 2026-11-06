import { loginUseCase } from '../../../../src/application/use-cases/auth/LoginUseCase.js';

describe('LoginUseCase', () => {
    let authRepository;
    let userRepository;
    let useCase;

    beforeEach(() => {
        authRepository = {
            signIn: jest.fn(),
        };
        userRepository = {
            findById: jest.fn(),
            create: jest.fn(),
            updateById: jest.fn(),
        };
        useCase = loginUseCase(authRepository, userRepository);
    });

    it('should return a session when login is successful', async () => {
        const authDTO = { email: 'test@example.com', password: 'password' };
        const loginResponse = {
            user: { id: 'user123', user_metadata: { name: 'Test' } }, // eslint-disable-line camelcase
            /* eslint-disable camelcase */
            session: {
                access_token: 'test_token',
                refresh_token: 'refresh_token',
                expires_at: 1234567890,
            },
            /* eslint-enable camelcase */
        };
        authRepository.signIn.mockResolvedValue(loginResponse);
        userRepository.findById.mockResolvedValue({
            _id: 'user123',
            email: 'test@example.com',
            role: 'buyer',
        });

        const result = await useCase(authDTO);

        expect(authRepository.signIn).toHaveBeenCalledWith(authDTO.email, authDTO.password);
        expect(result.token).toBe('test_token');
    });

    it('should create user in MongoDB if not found', async () => {
        const authDTO = { email: 'test@example.com', password: 'password' };
        const loginResponse = {
            user: { id: 'supabase_id', user_metadata: { name: 'New User', role: 'buyer' } }, // eslint-disable-line camelcase
            session: { access_token: 'test_token', refresh_token: 'refresh_token' }, // eslint-disable-line camelcase
        };
        authRepository.signIn.mockResolvedValue(loginResponse);
        userRepository.findById.mockResolvedValue(null);
        userRepository.create.mockResolvedValue({ _id: 'supabase_id', email: 'test@example.com' });

        const result = await useCase(authDTO);

        expect(userRepository.create).toHaveBeenCalled();
        expect(result.token).toBe('test_token');
    });

    it('should throw an error when login fails', async () => {
        const authDTO = { email: 'test@example.com', password: 'wrong_password' };
        const error = new Error('Invalid credentials');
        authRepository.signIn.mockRejectedValue(error);

        await expect(useCase(authDTO)).rejects.toThrow(error);
    });
});
