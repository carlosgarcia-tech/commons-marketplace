import { AuthDTO } from '../../dtos/users/AuthDTO.js';
import { log } from '../../../infrastructure/logger/logger.js';

export const refreshTokenUseCase = (authRepository) => async (refreshToken) => {
    log.debug('Executing refresh token use case');

    const session = await authRepository.refreshSession(refreshToken);

    log.info('Token refresh successful', { userId: session.user?.id });

    return AuthDTO.loginResponse(session, {
        token: session.session.access_token,
        user: null,
    });
};
