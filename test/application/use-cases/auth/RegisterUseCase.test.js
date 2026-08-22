import { registerUseCase } from '../../../../src/application/use-cases/auth/RegisterUseCase.js';
import { AuthDTO } from '../../../../src/application/dtos/users/AuthDTO.js';
import { UserResponseDTO } from '../../../../src/application/dtos/users/UserResponseDTO.js';

describe('RegisterUseCase', () => {
    let authRepository;
    let userRepository;
    let useCase;

    beforeEach(() => {
        authRepository = {
            signUp: jest.fn(),
        };
        userRepository = {
            create: jest.fn(),
        };
        useCase = registerUseCase(authRepository, userRepository);
    });

    it('should return needsEmailConfirmation when signUp succeeds without session', async () => {
        const authDTO = { email: 'test@example.com', password: 'password' };
        const authResponse = { user: { id: 'supabase_id' } };

        authRepository.signUp.mockResolvedValue(authResponse);

        const result = await useCase(authDTO);

        expect(result.needsEmailConfirmation).toBe(true);
        expect(result.message).toBe(
            'Por favor, revisa tu correo electrónico para confirmar tu cuenta',
        );
        expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should create user in MongoDB when signUp returns session', async () => {
        const authDTO = { email: 'test@example.com', password: 'password' };
        const authResponse = {
            user: { id: 'supabase_id' },
            session: { access_token: 'token' }, // eslint-disable-line camelcase
        };
        const createdUser = {
            _id: 'supabase_id',
            name: null,
            email: 'test@example.com',
            isApprovedSeller: false,
            role: 'buyer',
        };

        authRepository.signUp.mockResolvedValue(authResponse);
        userRepository.create.mockResolvedValue(createdUser);

        const result = await useCase(authDTO);

        expect(authRepository.signUp).toHaveBeenCalledWith(authDTO.email, authDTO.password);
        expect(userRepository.create).toHaveBeenCalled();
        expect(result).toEqual(AuthDTO.registerResponse(UserResponseDTO.from(createdUser)));
    });

    it('should ignore self-assigned roles from input to prevent privilege escalation', async () => {
        const authDTO = { email: 'test@example.com', password: 'password', role: 'admin' };
        const authResponse = {
            user: { id: 'supabase_id' },
            session: { access_token: 'token' }, // eslint-disable-line camelcase
        };
        const createdUser = {
            _id: 'supabase_id',
            name: null,
            email: 'test@example.com',
            isApprovedSeller: false,
            role: 'buyer',
        };

        authRepository.signUp.mockResolvedValue(authResponse);
        userRepository.create.mockResolvedValue(createdUser);

        await useCase(authDTO);

        expect(authRepository.signUp).toHaveBeenCalledWith(authDTO.email, authDTO.password);
        expect(authRepository.signUp.mock.calls[0][2]).toBeUndefined();
    });

    it('should throw an error when signUp fails', async () => {
        const authDTO = { email: 'test@example.com', password: 'password' };
        const error = new Error('Email already in use');
        authRepository.signUp.mockRejectedValue(error);

        await expect(useCase(authDTO)).rejects.toThrow(error);
    });
});
