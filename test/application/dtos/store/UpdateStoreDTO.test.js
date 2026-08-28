import { createUpdateStoreDTO } from '../../../../src/application/dtos/stores/UpdateStoreDTO.js';

describe('UpdateStoreDTO Tests', () => {
    it('should create a valid UpdateStoreDTO with storeName', () => {
        const data = {
            storeName: 'Updated Store Name',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            storeName: 'Updated Store Name',
        });
        expect(Object.isFrozen(dto)).toBe(true);
    });

    it('should create a valid UpdateStoreDTO with description', () => {
        const data = {
            description: 'Updated store description',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            description: 'Updated store description',
        });
        expect(Object.isFrozen(dto)).toBe(true);
    });

    it('should create a valid UpdateStoreDTO with logo', () => {
        const data = {
            logo: 'https://example.com/new-logo.jpg',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            logo: 'https://example.com/new-logo.jpg',
        });
        expect(Object.isFrozen(dto)).toBe(true);
    });

    it('should create a valid UpdateStoreDTO with multiple fields', () => {
        const data = {
            storeName: 'Updated Store Name',
            description: 'Updated store description',
            logo: 'https://example.com/new-logo.jpg',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            storeName: 'Updated Store Name',
            description: 'Updated store description',
            logo: 'https://example.com/new-logo.jpg',
        });
        expect(Object.isFrozen(dto)).toBe(true);
    });

    it('should filter out undefined fields', () => {
        const data = {
            storeName: 'Updated Store Name',
            description: undefined,
            logo: 'https://example.com/new-logo.jpg',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            storeName: 'Updated Store Name',
            logo: 'https://example.com/new-logo.jpg',
        });
        expect(dto.description).toBeUndefined();
    });

    it('should handle empty string values', () => {
        const data = {
            storeName: '',
            description: 'Updated description',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            storeName: '',
            description: 'Updated description',
        });
    });

    it('should handle null values', () => {
        const data = {
            description: null,
            logo: 'https://example.com/new-logo.jpg',
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            description: null,
            logo: 'https://example.com/new-logo.jpg',
        });
    });

    it('should throw error when no fields are provided', () => {
        const data = {};

        expect(() => createUpdateStoreDTO(data)).toThrow(
            'At least one field (storeName, description, logo, categoryIds, seoTitle, seoDescription) must be provided for an update.',
        );
    });

    it('should throw error when all fields are undefined', () => {
        const data = {
            storeName: undefined,
            description: undefined,
            logo: undefined,
        };

        expect(() => createUpdateStoreDTO(data)).toThrow(
            'At least one field (storeName, description, logo, categoryIds, seoTitle, seoDescription) must be provided for an update.',
        );
    });

    it('should NOT throw error when fields have null values (null is considered a valid update)', () => {
        const data = {
            storeName: null,
            description: null,
            logo: null,
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            storeName: null,
            description: null,
            logo: null,
        });
    });

    it('should accept at least one non-undefined field', () => {
        const data = {
            storeName: undefined,
            description: 'Valid description',
            logo: undefined,
        };

        const dto = createUpdateStoreDTO(data);

        expect(dto).toEqual({
            description: 'Valid description',
        });
    });
});
