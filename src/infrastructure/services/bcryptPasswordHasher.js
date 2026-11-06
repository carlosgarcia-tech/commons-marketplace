import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash.
 * @param {string} password - The password to verify.
 * @param {string} hash - The hash to compare against.
 * @returns {Promise<boolean>} True if the password matches.
 */
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export default {
    hashPassword,
    verifyPassword,
};
