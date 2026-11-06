const { UpdateUserDTO } = require('../../../../src/application/dtos/users/UpdateUserDTO.js');

describe('UpdateUserDTO', () => {
    describe('from', () => {
        it('should extract name when provided', () => {
            const result = UpdateUserDTO.from({ name: 'John' });
            expect(result.name).toBe('John');
        });

        it('should extract lastName when provided', () => {
            const result = UpdateUserDTO.from({ lastName: 'Doe' });
            expect(result.lastName).toBe('Doe');
        });

        it('should extract phoneNumber when provided', () => {
            const result = UpdateUserDTO.from({ phoneNumber: '1234567890' });
            expect(result.phoneNumber).toBe('1234567890');
        });

        it('should extract address when provided', () => {
            const result = UpdateUserDTO.from({ address: '123 Main St' });
            expect(result.address).toBe('123 Main St');
        });

        it('should extract profilePicUrl when provided', () => {
            const result = UpdateUserDTO.from({ profilePicUrl: 'https://example.com/pic.jpg' });
            expect(result.profilePicUrl).toBe('https://example.com/pic.jpg');
        });

        it('should exclude undefined fields', () => {
            const result = UpdateUserDTO.from({ name: 'John' });
            expect(result.lastName).toBeUndefined();
        });

        it('should handle empty object', () => {
            const result = UpdateUserDTO.from({});
            expect(result).toEqual({});
        });
    });

    describe('validate', () => {
        it('should return valid when name provided', () => {
            const result = UpdateUserDTO.validate({ name: 'John' });
            expect(result.valid).toBe(true);
        });

        it('should return valid when multiple fields provided', () => {
            const result = UpdateUserDTO.validate({ name: 'John', lastName: 'Doe' });
            expect(result.valid).toBe(true);
        });

        it('should return invalid when no valid fields', () => {
            const result = UpdateUserDTO.validate({ invalid: 'value' });
            expect(result.valid).toBe(false);
        });

        it('should return invalid when all fields are undefined', () => {
            const result = UpdateUserDTO.validate({ name: undefined });
            expect(result.valid).toBe(false);
        });

        it('should return empty errors array when valid', () => {
            const result = UpdateUserDTO.validate({ name: 'John' });
            expect(result.errors).toEqual([]);
        });
    });

    describe('sanitize', () => {
        it('should remove undefined values', () => {
            const result = UpdateUserDTO.sanitize({ name: 'John', lastName: undefined });
            expect(result).toEqual({ name: 'John' });
        });

        it('should handle all undefined', () => {
            const result = UpdateUserDTO.sanitize({ name: undefined });
            expect(result).toEqual({});
        });

        it('should keep defined values', () => {
            const result = UpdateUserDTO.sanitize({ name: 'John', lastName: 'Doe' });
            expect(result).toEqual({ name: 'John', lastName: 'Doe' });
        });
    });
});
