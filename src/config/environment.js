const environments = {
    local: {
        corsOrigins: [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://192.168.1.88:3000',
            'http://192.168.1.88:5000',
            'http://192.168.1.88:8080',
            'https://192.168.1.88:8443',
            'https://192.168.1.88:8444',
            'https://localhost:8443',
            'https://localhost:8444',
        ],
        apiUrl: 'http://localhost:3000',
        uiUrl: 'http://localhost:8080',
        enableSwagger: true,
        logLevel: 'debug',
    },
    development: {
        corsOrigins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
            : ['http://localhost:3000', 'http://localhost:8080'],
        apiUrl: process.env.API_URL || 'http://localhost:3000',
        uiUrl: process.env.UI_URL || 'http://localhost:8080',
        enableSwagger: true,
        logLevel: 'debug',
    },
    production: {
        corsOrigins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
            : [],
        apiUrl: process.env.API_URL || '',
        uiUrl: process.env.UI_URL || '',
        enableSwagger: false,
        logLevel: 'error',
    },
    staging: {
        corsOrigins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
            : [],
        apiUrl: process.env.API_URL || '',
        uiUrl: process.env.UI_URL || '',
        enableSwagger: false,
        logLevel: 'warn',
    },
    test: {
        corsOrigins: ['http://localhost:3000'],
        apiUrl: 'http://localhost:5000',
        uiUrl: 'http://localhost:3000',
        enableSwagger: false,
        logLevel: 'silent',
    },
};

/**
 * Parses the TRUST_PROXY environment variable into a value accepted by
 * Express `app.set('trust proxy', ...)`.
 * Accepts hop counts ('1'), 'true'/'false' and express proxy names
 * such as 'loopback'. Defaults to 1 hop (single reverse proxy, e.g. nginx).
 * @param {string} [value] - Raw environment variable value
 * @returns {boolean|string|number} Trust proxy setting for Express
 */
const parseTrustProxy = (value) => {
    if (value === undefined || value === '') {
        return 1;
    }
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

const getEnvironmentConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    const config = environments[env];

    if (!config) {
        throw new Error(`Unknown environment: ${env}`);
    }

    return {
        ...config,
        nodeEnv: env,
        port: parseInt(process.env.PORT || '3000', 10),
        dbUrl: process.env.DB_URL,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'CommonMarketplace',
        ablyApiKey: process.env.ABLY_API_KEY,
        trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    };
};

const validateEnvironment = () => {
    const required = [
        'DB_URL',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ABLY_API_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

export { getEnvironmentConfig, validateEnvironment };
