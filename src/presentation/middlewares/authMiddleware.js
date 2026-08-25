import supabase from '../../infrastructure/supabase/config/supabaseClient.js';
import { unauthorizedException } from '../exceptions/unauthorizedException.js';
import { UserRepositoryImpl } from '../../infrastructure/database/mongo/repositories/userRepository.js';

/**
 * Express middleware that authenticates requests using a Supabase JWT token.
 *
 * This middleware extracts the Bearer token from the `Authorization` header,
 * validates it using Supabase Auth, and attaches the authenticated user
 * information to the `req` object.
 *
 * If the token is missing, invalid, or expired, it throws an `unauthorizedException`.
 * @async
 * @function authenticate
 * @param {import('express').Request} req - Express request object containing the authorization header.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @throws {Error} Throws an unauthorizedException if authentication fails.
 * @returns {Promise<void>} Returns nothing if the authentication succeeds; calls `next()` to continue.
 * @example
 * import { authenticate } from '../middleware/authenticate.js';
 *
 * app.get('/profile', authenticate, (req, res) => {
 *   res.json({ user: req.user });
 * });
 */

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw unauthorizedException('Token missing');

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            throw unauthorizedException('Invalid or expired token');
        }

        req.user = data.user;
        req.token = token;

        // MongoDB is the app's source of truth for roles. The JWT only
        // proves identity: its metadata snapshot goes stale as soon as a
        // role is edited in Supabase after login, which used to 403 admin
        // routes forever. Non-fatal if the profile is missing yet.
        try {
            req.mongoUser = (await UserRepositoryImpl.findById(data.user.id)) || null;
        } catch (dbError) {
            console.error('[auth] Failed to load user profile:', dbError?.message);
            req.mongoUser = null;
        }
        next();
    } catch (error) {
        next(error);
    }
};
