import { AuthDTO } from '../../application/dtos/users/AuthDTO.js';

export const createAuthController = (registerUC, loginUC, logoutUC, refreshTokenUC) => ({
    register: async (req, res, next) => {
        try {
            const authDTO = AuthDTO.registerRequest(req.body);
            const response = await registerUC(authDTO);

            if (response.needsEmailConfirmation) {
                return res.status(200).json(response);
            }

            res.status(201).json(response);
        } catch (error) {
            next(error);
        }
    },

    login: async (req, res, next) => {
        try {
            const authDTO = AuthDTO.loginRequest(req.body);
            const response = await loginUC(authDTO);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    },

    logout: async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            const response = await logoutUC(token);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }
            const response = await refreshTokenUC(refreshToken);
            res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    },
});
