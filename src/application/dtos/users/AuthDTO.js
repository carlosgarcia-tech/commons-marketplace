export const AuthDTO = {
    registerRequest: (data) => ({
        email: data.email,
        password: data.password,
    }),

    registerResponse: (user, message = 'User registered successfully') => ({
        message,
        user,
    }),

    loginRequest: (data) => ({
        email: data.email,
        password: data.password,
    }),

    loginResponse: (session, extra = {}, message = 'Login successful') => ({
        message,
        token: session?.access_token || extra?.token,
        refreshToken: session?.refresh_token,
        expiresAt: session?.expires_at,
        user: extra?.user || null,
    }),

    logoutResponse: (message = 'Logged out successfully') => ({
        message,
    }),
};
