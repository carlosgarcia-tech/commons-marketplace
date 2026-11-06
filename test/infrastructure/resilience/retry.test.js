import {
    withRetry,
    retryable,
    RetryOptions,
} from '../../../src/infrastructure/resilience/retry.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Retry Utilities', () => {
    describe('withRetry', () => {
        it('should execute function successfully on first try', async () => {
            const fn = jest.fn().mockResolvedValue('success');
            const result = await withRetry(fn);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should pass through the result from successful execution', async () => {
            const fn = jest.fn().mockResolvedValue('result');
            const result = await withRetry(fn, { maxRetries: 3 });
            expect(result).toBe('result');
        });
    });

    describe('retryable', () => {
        it('should create a function that returns a promise', async () => {
            const fn = jest.fn().mockResolvedValue('value');
            const retryableFn = retryable(fn);
            const result = await retryableFn();
            expect(result).toBe('value');
        });

        it('should pass arguments to the function', async () => {
            const fn = jest.fn().mockResolvedValue('args');
            const retryableFn = retryable(fn);
            await retryableFn('arg1', 'arg2');
            expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should handle async functions', async () => {
            const fn = jest.fn().mockResolvedValue('async');
            const retryableFn = retryable(fn);
            const result = await retryableFn();
            expect(result).toBe('async');
        });
    });

    describe('RetryOptions', () => {
        it('should create default options', () => {
            const opts = new RetryOptions();
            expect(opts.maxRetries).toBe(3);
            expect(opts.retryDelay).toBe(1000);
            expect(opts.backoffMultiplier).toBe(2);
        });

        it('should allow configuring max retries', () => {
            const opts = new RetryOptions().withMaxRetries(5);
            expect(opts.maxRetries).toBe(5);
        });

        it('should allow fluent configuration', () => {
            const opts = new RetryOptions().withMaxRetries(10).withRetryDelay(500).withBackoff(3);
            expect(opts.maxRetries).toBe(10);
            expect(opts.retryDelay).toBe(500);
            expect(opts.backoffMultiplier).toBe(3);
        });

        it('should build final options', () => {
            const opts = new RetryOptions().withMaxRetries(5).build();
            expect(opts.maxRetries).toBe(5);
        });
    });
});
