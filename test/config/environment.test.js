import { getEnvironmentConfig, validateEnvironment } from '../../src/config/environment.js';

describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    describe('getEnvironmentConfig', () => {
        describe('local environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should return local configuration', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('local');
                expect(config.enableSwagger).toBe(true);
                expect(config.logLevel).toBe('debug');
                expect(config.apiUrl).toBe('http://localhost:3000');
                expect(config.uiUrl).toBe('http://localhost:8080');
            });

            it('should include local CORS origins', () => {
                const config = getEnvironmentConfig();

                expect(config.corsOrigins).toContain('http://localhost:3000');
                expect(config.corsOrigins).toContain('http://192.168.1.88:3000');
                expect(config.corsOrigins).toContain('https://localhost:8443');
            });
        });

        describe('development environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'development';
            });

            it('should return development configuration', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('development');
                expect(config.enableSwagger).toBe(true);
                expect(config.logLevel).toBe('debug');
                expect(config.apiUrl).toBe('http://localhost:3000');
                expect(config.uiUrl).toBe('http://localhost:8080');
            });

            it('should include development CORS origins', () => {
                const config = getEnvironmentConfig();

                expect(config.corsOrigins).toContain('http://localhost:3000');
                expect(config.corsOrigins).toContain('http://localhost:8080');
            });
        });

        describe('production environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'production';
            });

            it('should return production configuration', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('production');
                expect(config.enableSwagger).toBe(false);
                expect(config.logLevel).toBe('error');
                expect(config.apiUrl).toBe('');
                expect(config.uiUrl).toBe('');
            });

            it('should include production CORS origins from env or empty array', () => {
                const config = getEnvironmentConfig();

                expect(Array.isArray(config.corsOrigins)).toBe(true);
            });

            it('should disable Swagger in production', () => {
                const config = getEnvironmentConfig();

                expect(config.enableSwagger).toBe(false);
            });
        });

        describe('staging environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'staging';
            });

            it('should return staging configuration', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('staging');
                expect(config.enableSwagger).toBe(false);
                expect(config.logLevel).toBe('warn');
            });

            it('should include staging CORS origins from env or empty array', () => {
                const config = getEnvironmentConfig();

                expect(Array.isArray(config.corsOrigins)).toBe(true);
            });
        });

        describe('test environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'test';
            });

            it('should return test configuration', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('test');
                expect(config.enableSwagger).toBe(false);
                expect(config.logLevel).toBe('silent');
                expect(config.apiUrl).toBe('http://localhost:5000');
                expect(config.uiUrl).toBe('http://localhost:3000');
            });

            it('should include test CORS origins', () => {
                const config = getEnvironmentConfig();

                expect(config.corsOrigins).toEqual(['http://localhost:3000']);
            });
        });

        describe('default environment', () => {
            beforeEach(() => {
                delete process.env.NODE_ENV;
            });

            it('should default to development when NODE_ENV is not set', () => {
                const config = getEnvironmentConfig();

                expect(config.nodeEnv).toBe('development');
                expect(config.apiUrl).toBe('http://localhost:3000');
            });
        });

        describe('unknown environment', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'invalid-env';
            });

            it('should throw error for unknown environment', () => {
                expect(() => getEnvironmentConfig()).toThrow('Unknown environment: invalid-env');
            });
        });

        describe('port configuration', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should use default port 3000 when PORT is not set', () => {
                delete process.env.PORT;
                const config = getEnvironmentConfig();

                expect(config.port).toBe(3000);
            });

            it('should use PORT environment variable when set', () => {
                process.env.PORT = '8080';
                const config = getEnvironmentConfig();

                expect(config.port).toBe(8080);
            });

            it('should parse PORT as integer', () => {
                process.env.PORT = '5000';
                const config = getEnvironmentConfig();

                expect(config.port).toBe(5000);
                expect(typeof config.port).toBe('number');
            });
        });

        describe('database configuration', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should include database URL from environment', () => {
                process.env.DB_URL = 'mongodb://localhost:27017/test';
                const config = getEnvironmentConfig();

                expect(config.dbUrl).toBe('mongodb://localhost:27017/test');
            });

            it('should handle missing DB_URL', () => {
                delete process.env.DB_URL;
                const config = getEnvironmentConfig();

                expect(config.dbUrl).toBeUndefined();
            });
        });

        describe('Supabase configuration', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should include all Supabase configuration', () => {
                process.env.SUPABASE_URL = 'https://test.supabase.co';
                process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_key';
                process.env.SUPABASE_SECRET_KEY = 'sb_secret_test_key';

                const config = getEnvironmentConfig();

                expect(config.supabaseUrl).toBe('https://test.supabase.co');
                expect(config.supabasePublishableKey).toBe('sb_publishable_test_key');
                expect(config.supabaseSecretKey).toBe('sb_secret_test_key');
            });

            it('should use default storage bucket when not specified', () => {
                const config = getEnvironmentConfig();

                expect(config.supabaseStorageBucket).toBe('CommonMarketplace');
            });

            it('should use custom storage bucket when specified', () => {
                process.env.SUPABASE_STORAGE_BUCKET = 'custom-bucket';
                const config = getEnvironmentConfig();

                expect(config.supabaseStorageBucket).toBe('custom-bucket');
            });
        });
        describe('Ably configuration', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should include Ably API key', () => {
                process.env.ABLY_API_KEY = 'ably-key-789';
                const config = getEnvironmentConfig();

                expect(config.ablyApiKey).toBe('ably-key-789');
            });

            it('should handle missing Ably API key', () => {
                delete process.env.ABLY_API_KEY;

                const config = getEnvironmentConfig();

                expect(config.ablyApiKey).toBeUndefined();
            });
        });

        describe('trust proxy configuration', () => {
            beforeEach(() => {
                process.env.NODE_ENV = 'local';
            });

            it('should default to 1 proxy hop when TRUST_PROXY is not set', () => {
                delete process.env.TRUST_PROXY;
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe(1);
            });

            it('should default to 1 when TRUST_PROXY is empty string', () => {
                process.env.TRUST_PROXY = '';
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe(1);
            });

            it('should parse numeric hop counts', () => {
                process.env.TRUST_PROXY = '2';
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe(2);
            });

            it('should accept true literal', () => {
                process.env.TRUST_PROXY = 'true';
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe(true);
            });

            it('should accept false literal for setups without proxy', () => {
                process.env.TRUST_PROXY = 'false';
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe(false);
            });

            it('should pass through express proxy names like loopback', () => {
                process.env.TRUST_PROXY = 'loopback';
                const config = getEnvironmentConfig();

                expect(config.trustProxy).toBe('loopback');
            });
        });
    });

    describe('validateEnvironment', () => {
        beforeEach(() => {
            process.env.DB_URL = 'mongodb://localhost:27017/test';
            process.env.SUPABASE_URL = 'https://test.supabase.co';
            process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_key';
            process.env.SUPABASE_SECRET_KEY = 'sb_secret_key';
            process.env.ABLY_API_KEY = 'ably-key';
        });

        it('should not throw when all required variables are set', () => {
            expect(() => validateEnvironment()).not.toThrow();
        });

        it('should throw error when DB_URL is missing', () => {
            delete process.env.DB_URL;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: DB_URL',
            );
        });

        it('should throw error when SUPABASE_URL is missing', () => {
            delete process.env.SUPABASE_URL;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: SUPABASE_URL',
            );
        });

        it('should throw error when SUPABASE_PUBLISHABLE_KEY is missing', () => {
            delete process.env.SUPABASE_PUBLISHABLE_KEY;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: SUPABASE_PUBLISHABLE_KEY',
            );
        });

        it('should throw error when SUPABASE_SECRET_KEY is missing', () => {
            delete process.env.SUPABASE_SECRET_KEY;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: SUPABASE_SECRET_KEY',
            );
        });

        it('should throw error when ABLY_API_KEY is missing', () => {
            delete process.env.ABLY_API_KEY;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: ABLY_API_KEY',
            );
        });

        it('should throw error listing all missing variables', () => {
            delete process.env.DB_URL;
            delete process.env.SUPABASE_URL;
            delete process.env.ABLY_API_KEY;

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: DB_URL, SUPABASE_URL, ABLY_API_KEY',
            );
        });

        it('should handle empty string as missing variable', () => {
            process.env.DB_URL = '';

            expect(() => validateEnvironment()).toThrow(
                'Missing required environment variables: DB_URL',
            );
        });
    });
});
