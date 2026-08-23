import express from 'express';
import request from 'supertest';
import {
    authLimiter,
    apiLimiter,
    uploadLimiter,
    passwordResetLimiter,
    chatLimiter,
} from '../../../src/presentation/middlewares/rateLimiter.js';
import { tooManyRequestsException } from '../../../src/presentation/exceptions/index.js';

describe('Rate Limiter Middleware', () => {
    describe('Exports', () => {
        it('should export authLimiter', () => {
            expect(authLimiter).toBeDefined();
        });

        it('should export apiLimiter', () => {
            expect(apiLimiter).toBeDefined();
        });

        it('should export uploadLimiter', () => {
            expect(uploadLimiter).toBeDefined();
        });

        it('should export passwordResetLimiter', () => {
            expect(passwordResetLimiter).toBeDefined();
        });

        it('should export chatLimiter', () => {
            expect(chatLimiter).toBeDefined();
        });
    });

    describe('Rate Limit Methods', () => {
        it('authLimiter should have getKey method', () => {
            expect(typeof authLimiter.getKey).toBe('function');
        });

        it('apiLimiter should have getKey method', () => {
            expect(typeof apiLimiter.getKey).toBe('function');
        });

        it('authLimiter should have resetKey method', () => {
            expect(typeof authLimiter.resetKey).toBe('function');
        });

        it('apiLimiter should have resetKey method', () => {
            expect(typeof apiLimiter.resetKey).toBe('function');
        });

        it('uploadLimiter should have getKey method', () => {
            expect(typeof uploadLimiter.getKey).toBe('function');
        });

        it('passwordResetLimiter should have getKey method', () => {
            expect(typeof passwordResetLimiter.getKey).toBe('function');
        });

        it('chatLimiter should have getKey method', () => {
            expect(typeof chatLimiter.getKey).toBe('function');
        });
    });

    describe('tooManyRequestsException', () => {
        it('should create exception with statusCode 429', () => {
            const error = tooManyRequestsException('Test message');
            expect(error.statusCode).toBe(429);
            expect(error.message).toBe('Test message');
            expect(error.name).toBe('TooManyRequestsException');
        });
    });

    describe('per-client bucketing behind a reverse proxy', () => {
        const buildApp = () => {
            const app = express();
            app.set('trust proxy', 1);
            app.post('/login', authLimiter, (req, res) => res.status(200).json({ ok: true }));
            // eslint-disable-next-line no-unused-vars
            app.use((err, req, res, next) => {
                res.status(err.statusCode || 500).json({ message: err.message });
            });
            return app;
        };

        it('should not share the limit bucket between different client IPs', async () => {
            const app = buildApp();
            const attackerIp = '203.0.113.10';
            const victimIp = '198.51.100.22';

            for (let attempt = 0; attempt < 5; attempt++) {
                const res = await request(app).post('/login').set('X-Forwarded-For', attackerIp);
                expect(res.status).toBe(200);
            }

            const blocked = await request(app).post('/login').set('X-Forwarded-For', attackerIp);
            expect(blocked.status).toBe(429);

            const victim = await request(app).post('/login').set('X-Forwarded-For', victimIp);
            expect(victim.status).toBe(200);
        });

        it('should resolve req.ip from X-Forwarded-For when trust proxy is enabled', async () => {
            const app = express();
            app.set('trust proxy', 1);
            let seenIp;
            app.get('/', authLimiter, (req, res) => {
                seenIp = req.ip;
                res.status(200).end();
            });

            await request(app).get('/').set('X-Forwarded-For', '192.0.2.7');

            expect(seenIp).toBe('192.0.2.7');
        });
    });
});
