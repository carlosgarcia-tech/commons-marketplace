import { createStore } from '../../../src/core/entities/Store.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Store Entity', () => {
    describe('createStore', () => {
        it('should create a store with all provided fields', () => {
            const store = createStore({
                id: 'store123',
                userId: 'user123',
                storeName: 'My Store',
                description: 'A great store',
                logo: 'https://example.com/logo.png',
                status: 'Approved',
            });
            expect(store.id).toBe('store123');
            expect(store.userId).toBe('user123');
            expect(store.storeName).toBe('My Store');
            expect(store.description).toBe('A great store');
            expect(store.logo).toBe('https://example.com/logo.png');
            expect(store.status).toBe('Approved');
        });

        it('should throw error when userId is missing', () => {
            expect(() => createStore({ storeName: 'My Store' })).toThrow(
                'Store must have a userId and a storeName.',
            );
        });

        it('should throw error when storeName is missing', () => {
            expect(() => createStore({ userId: 'user123' })).toThrow(
                'Store must have a userId and a storeName.',
            );
        });

        it('should throw error when both are missing', () => {
            expect(() => createStore({})).toThrow('Store must have a userId and a storeName.');
        });

        it('should set default description to empty string', () => {
            const store = createStore({ userId: 'user123', storeName: 'My Store' });
            expect(store.description).toBe('');
        });

        it('should set default status to Pending', () => {
            const store = createStore({ userId: 'user123', storeName: 'My Store' });
            expect(store.status).toBe('Pending');
        });

        it('should set default logo when not provided', () => {
            const store = createStore({ userId: 'user123', storeName: 'My Store' });
            expect(store.logo).toBeDefined();
            expect(typeof store.logo).toBe('string');
            expect(store.logo.length).toBeGreaterThan(0);
        });

        it('should accept custom status values', () => {
            expect(createStore({ userId: '1', storeName: 'S1', status: 'Pending' }).status).toBe(
                'Pending',
            );
            expect(createStore({ userId: '2', storeName: 'S2', status: 'Approved' }).status).toBe(
                'Approved',
            );
            expect(createStore({ userId: '3', storeName: 'S3', status: 'Rejected' }).status).toBe(
                'Rejected',
            );
        });

        it('should set id to null when not provided', () => {
            const store = createStore({ userId: 'user123', storeName: 'My Store' });
            expect(store.id).toBeNull();
        });

        it('should return frozen object', () => {
            const store = createStore({ userId: 'user123', storeName: 'My Store' });
            expect(Object.isFrozen(store)).toBe(true);
        });

        it('should throw error for empty string values', () => {
            expect(() => createStore({ userId: '', storeName: '' })).toThrow(
                'Store must have a userId and a storeName.',
            );
        });
    });
});
