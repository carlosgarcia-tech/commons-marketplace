/* eslint-env jest */
process.env.NODE_ENV = 'test';

jest.mock('../src/infrastructure/supabase/config/supabaseClient.js', () => ({
    __esModule: true,
    default: {
        storage: {
            from: jest.fn().mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: jest
                    .fn()
                    .mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
                remove: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
        },
        auth: {
            getUser: jest
                .fn()
                .mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
        },
    },
    supabaseAdmin: {
        storage: {
            from: jest.fn().mockReturnValue({
                upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: jest
                    .fn()
                    .mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
                remove: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
        },
    },
}));

jest.mock('../src/infrastructure/cache/cacheManager.js', () => ({
    __esModule: true,
    cacheManager: {
        get: jest.fn().mockReturnValue(null),
        set: jest.fn().mockReturnValue(true),
        del: jest.fn().mockReturnValue(true),
        delPattern: jest.fn().mockReturnValue(0),
        flushAll: jest.fn(),
        has: jest.fn().mockReturnValue(false),
        getStats: jest.fn().mockReturnValue({ hits: 0, misses: 0 }),
    },
    CACHE_TTL: {
        CATEGORIES: 1,
        MAIN_CATEGORIES: 1,
        SUBCATEGORIES: 1,
    },
    CACHE_KEYS: {
        CATEGORIES: 'categories:all',
        MAIN_CATEGORIES: 'categories:main',
        SUBCATEGORIES: 'categories:sub:',
    },
    invalidateCache: jest.fn(),
    getCachedOrFetch: jest.fn(),
}));

jest.mock('../src/infrastructure/resilience/circuitBreaker.js', () => ({
    __esModule: true,
    CircuitBreaker: jest.fn().mockImplementation(() => ({
        execute: jest.fn(),
        getStatus: jest.fn().mockReturnValue({ state: 'closed', failures: 0 }),
    })),
    CircuitBreakerRegistry: jest.fn(),
    circuitRegistry: {
        getOrCreate: jest.fn(),
        getAllStatus: jest.fn().mockReturnValue([]),
        resetAll: jest.fn(),
    },
}));

jest.mock('../src/infrastructure/services/healthCheck.js', () => ({
    __esModule: true,
    HealthCheck: {
        checkAll: jest.fn().mockResolvedValue({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: 0,
            checks: { mongodb: { status: 'healthy' }, supabase: { status: 'healthy' } },
        }),
    },
}));

jest.mock('../src/infrastructure/logger/logger.js', () => ({
    log: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        debug: jest.fn(),
    },
    default: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        debug: jest.fn(),
    },
}));
