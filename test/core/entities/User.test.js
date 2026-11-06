import { User } from '../../../src/core/entities/User.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('User Entity', () => {
    describe('create', () => {
        it('should create a user with all provided fields', () => {
            const data = {
                _id: 'user123',
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                role: 'seller',
            };
            const user = User.create(data);
            expect(user._id).toBe('user123');
            expect(user.name).toBe('John');
            expect(user.lastName).toBe('Doe');
            expect(user.email).toBe('john@example.com');
            expect(user.role).toBe('seller');
        });

        it('should set default values for missing fields', () => {
            const user = User.create({ _id: 'user123' });
            expect(user.name).toBeNull();
            expect(user.lastName).toBeNull();
            expect(user.phoneNumber).toBeNull();
            expect(user.address).toBeNull();
            expect(user.email).toBeNull();
            expect(user.role).toBe('buyer');
            expect(user.isApprovedSeller).toBe(false);
            expect(user.profilePicUrl).toBe('https://api.dicebear.com/9.x/lorelei/svg');
        });

        it('should use default profile pic URL', () => {
            const user = User.create({ _id: 'user123' });
            expect(user.profilePicUrl).toBeDefined();
            expect(typeof user.profilePicUrl).toBe('string');
        });

        it('should preserve provided profile pic URL', () => {
            const customPic = 'https://example.com/pic.jpg';
            const user = User.create({ _id: 'user123', profilePicUrl: customPic });
            expect(user.profilePicUrl).toBe(customPic);
        });

        it('should set createdAt and updatedAt dates', () => {
            const user = User.create({ _id: 'user123' });
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });

        it('should handle all valid roles', () => {
            expect(User.create({ _id: '1', role: 'buyer' }).role).toBe('buyer');
            expect(User.create({ _id: '2', role: 'seller' }).role).toBe('seller');
            expect(User.create({ _id: '3', role: 'admin' }).role).toBe('admin');
        });
    });

    describe('validate', () => {
        it('should return valid for correct user', () => {
            const user = { _id: 'user123', role: 'buyer' };
            const result = User.validate(user);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return invalid for missing ID', () => {
            const user = { _id: '', role: 'buyer' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('User ID must be a non-empty string');
        });

        it('should return invalid for null ID', () => {
            const user = { _id: null, role: 'buyer' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
        });

        it('should return invalid for undefined ID', () => {
            const user = { role: 'buyer' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
        });

        it('should return invalid for invalid role', () => {
            const user = { _id: 'user123', role: 'superuser' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Role must be one of: buyer, seller, admin');
        });

        it('should return invalid for null role', () => {
            const user = { _id: 'user123', role: null };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
        });

        it('should return invalid for undefined role', () => {
            const user = { _id: 'user123' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
        });

        it('should return invalid for non-string ID', () => {
            const user = { _id: 123, role: 'buyer' };
            const result = User.validate(user);
            expect(result.valid).toBe(false);
        });
    });
});
