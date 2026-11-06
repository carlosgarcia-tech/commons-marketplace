import { refreshTokenUseCase } from '../../../../src/application/use-cases/auth/RefreshTokenUseCase.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    },
}));

describe('RefreshTokenUseCase', () => {
    let mockAuthRepository;
    let refreshTokenUC;

    beforeEach(() => {
        mockAuthRepository = {
            refreshSession: jest.fn(),
        };
        refreshTokenUC = refreshTokenUseCase(mockAuthRepository);
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should refresh token successfully', async () => {
            const mockSession = {
                user: { id: 'user-123' },
                session: {
                    access_token: 'new-access-token', // eslint-disable-line camelcase
                    refresh_token: 'new-refresh-token', // eslint-disable-line camelcase
                    expires_at: 1234567890, // eslint-disable-line camelcase
                },
            };

            mockAuthRepository.refreshSession.mockResolvedValue(mockSession);

            const result = await refreshTokenUC('valid-refresh-token');

            expect(mockAuthRepository.refreshSession).toHaveBeenCalledWith('valid-refresh-token');
            expect(result).toHaveProperty('token', 'new-access-token');
            expect(result).toHaveProperty('expiresAt');
        });

        it('should throw error when refresh fails', async () => {
            const error = new Error('Invalid refresh token');
            mockAuthRepository.refreshSession.mockRejectedValue(error);

            await expect(refreshTokenUC('invalid-token')).rejects.toThrow('Invalid refresh token');
        });

        it('should call logger with debug info', async () => {
            const mockSession = {
                user: { id: 'user-123' },
                session: { access_token: 'token' }, // eslint-disable-line camelcase
            };
            mockAuthRepository.refreshSession.mockResolvedValue(mockSession);

            await refreshTokenUC('token');

            const { log } = require('../../../../src/infrastructure/logger/logger.js');
            expect(log.debug).toHaveBeenCalledWith('Executing refresh token use case');
        });
    });
});
