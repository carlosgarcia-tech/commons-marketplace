const { AuthDTO } = require('../../../../src/application/dtos/users/AuthDTO.js');

describe('AuthDTO', () => {
    describe('registerRequest', () => {
        it('should create register request with email and password', () => {
            const result = AuthDTO.registerRequest({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.email).toBe('test@example.com');
            expect(result.password).toBe('password123');
        });

        it('should not include role in the register request', () => {
            const result = AuthDTO.registerRequest({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.role).toBeUndefined();
        });

        it('should ignore self-assigned roles to prevent privilege escalation', () => {
            const result = AuthDTO.registerRequest({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin',
            });
            expect(result.role).toBeUndefined();
            expect(Object.keys(result)).toEqual(['email', 'password']);
        });
    });

    describe('registerResponse', () => {
        it('should create response with user and default message', () => {
            const user = { _id: 'user123', name: 'John' };
            const result = AuthDTO.registerResponse(user);
            expect(result.message).toBe('User registered successfully');
            expect(result.user).toEqual(user);
        });

        it('should use custom message when provided', () => {
            const user = { _id: 'user123' };
            const result = AuthDTO.registerResponse(user, 'Custom message');
            expect(result.message).toBe('Custom message');
        });
    });

    describe('loginRequest', () => {
        it('should create login request with email and password', () => {
            const result = AuthDTO.loginRequest({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.email).toBe('test@example.com');
            expect(result.password).toBe('password123');
        });
    });

    describe('loginResponse', () => {
        it('should create response with token and default message', () => {
            const mockSession = {
                access_token: 'token123',
                refresh_token: 'refresh123',
                expires_at: 1234567890,
            }; // eslint-disable-line camelcase
            const result = AuthDTO.loginResponse(mockSession);
            expect(result.message).toBe('Login successful');
            expect(result.token).toBe('token123');
            expect(result.refreshToken).toBe('refresh123');
            expect(result.expiresAt).toBe(1234567890);
        });

        it('should use extra token when session access_token is missing', () => {
            const mockSession = {};
            const result = AuthDTO.loginResponse(mockSession, { token: 'extra-token' });
            expect(result.token).toBe('extra-token');
        });

        it('should use custom message when provided', () => {
            const mockSession = { access_token: 'token123' }; // eslint-disable-line camelcase
            const result = AuthDTO.loginResponse(mockSession, {}, 'Welcome back!');
            expect(result.message).toBe('Welcome back!');
        });
    });

    describe('logoutResponse', () => {
        it('should create response with default message', () => {
            const result = AuthDTO.logoutResponse();
            expect(result.message).toBe('Logged out successfully');
        });

        it('should use custom message when provided', () => {
            const result = AuthDTO.logoutResponse('Session ended');
            expect(result.message).toBe('Session ended');
        });
    });
});
