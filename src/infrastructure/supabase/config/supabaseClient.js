import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { log } from '../../logger/logger.js';

dotenv.config();

/**
 * Ensures that all required environment variables for Supabase are defined.
 * Uses the current Supabase API keys: `SUPABASE_PUBLISHABLE_KEY`
 * (sb_publishable_...) for public operations and `SUPABASE_SECRET_KEY`
 * (sb_secret_...) for admin operations.
 * @throws {Error} Exits the process if any required variable is not set.
 * @description
 * This check guarantees that the Supabase clients can be initialized correctly.
 * If a required environment variable is missing, the process terminates
 * to prevent runtime connection issues. There is deliberately no fallback
 * from the secret key to the publishable key: admin operations would fail
 * cryptically at runtime.
 */
const isTest = process.env.NODE_ENV === 'test';

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const missingKeys = [
    !supabaseUrl && 'SUPABASE_URL',
    !supabasePublishableKey && 'SUPABASE_PUBLISHABLE_KEY',
    !supabaseSecretKey && 'SUPABASE_SECRET_KEY',
].filter(Boolean);

if (missingKeys.length > 0) {
    log.error('FATAL ERROR: Missing Supabase environment variables', { missingKeys });
    if (!isTest) {
        process.exit(1);
    }
}

/**
 * Standard Supabase client for regular operations (uses publishable key)
 * @constant
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabase = isTest
    ? null
    : createClient(supabaseUrl, supabasePublishableKey, {
          auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
          },
      });

log.info('Supabase client initialized successfully');

/**
 * Admin Supabase client for administrative operations (uses secret key)
 * @constant
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
const supabaseAdmin = isTest
    ? null
    : createClient(supabaseUrl, supabaseSecretKey, {
          auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
          },
      });

log.info('Supabase admin client initialized successfully', {
    hasSecretKey: !!supabaseSecretKey,
});

/**
 * Verifies the connection to the Supabase database by performing
 * a simple health check query.
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export const verifySupabaseConnection = async () => {
    try {
        log.debug('Verifying Supabase connection');

        const { error } = await supabase.from('_health').select('*').limit(1);

        if (error) {
            const { error: authError } = await supabase.auth.getSession();
            if (authError) {
                log.error('Supabase auth check failed', { error: authError.message });
                throw authError;
            }
        }

        log.info('Supabase connection verified successfully');
        return true;
    } catch (error) {
        log.error('Supabase connection failed', {
            error: error.message,
            stack: error.stack,
        });
        return false;
    }
};

export { supabaseAdmin };
export default supabase;
