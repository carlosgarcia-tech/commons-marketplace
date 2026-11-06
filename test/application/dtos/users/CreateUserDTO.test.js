const { CreateUserDTO } = require('../../../../src/application/dtos/users/CreateUserDTO.js');

describe('CreateUserDTO', () => {
    describe('from', () => {
        it('should create DTO with all fields', () => {
            const result = CreateUserDTO.from({
                _id: 'user123',
                name: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            });
            expect(result._id).toBe('user123');
            expect(result.name).toBe('John');
            expect(result.lastName).toBe('Doe');
            expect(result.email).toBe('john@example.com');
        });

        it('should set null defaults for missing fields', () => {
            const result = CreateUserDTO.from({ _id: 'user123' });
            expect(result.name).toBeNull();
            expect(result.lastName).toBeNull();
            expect(result.phoneNumber).toBeNull();
            expect(result.address).toBeNull();
            expect(result.profilePicUrl).toBeNull();
            expect(result.email).toBeNull();
        });

        it('should preserve provided profilePicUrl', () => {
            const result = CreateUserDTO.from({
                _id: 'user123',
                profilePicUrl: 'https://example.com/pic.jpg',
            });
            expect(result.profilePicUrl).toBe('https://example.com/pic.jpg');
        });
    });

    describe('validate', () => {
        it('should return valid for proper _id', () => {
            const result = CreateUserDTO.validate({ _id: 'user123' });
            expect(result.valid).toBe(true);
        });

        it('should return invalid for missing _id', () => {
            const result = CreateUserDTO.validate({});
            expect(result.valid).toBe(false);
        });

        it('should return invalid for empty _id', () => {
            const result = CreateUserDTO.validate({ _id: '' });
            expect(result.valid).toBe(false);
        });

        it('should return invalid for non-string _id', () => {
            const result = CreateUserDTO.validate({ _id: 123 });
            expect(result.valid).toBe(false);
        });

        it('should return invalid for whitespace-only _id', () => {
            const result = CreateUserDTO.validate({ _id: '   ' });
            expect(result.valid).toBe(false);
        });

        it('should return empty errors when valid', () => {
            const result = CreateUserDTO.validate({ _id: 'user123' });
            expect(result.errors).toEqual([]);
        });
    });
});
