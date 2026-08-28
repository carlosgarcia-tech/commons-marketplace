import { updateStoreUseCase } from '../../../../src/application/use-cases/store/UpdateStoreByUserIdUseCase.js';
import {
    createUpdateStoreDTO,
    createStoreResponseDTO,
} from '../../../../src/application/dtos/stores/index.js';
import { log } from '../../../../src/infrastructure/logger/logger.js';
describe('UpdateStoreUseCase Tests', () => {
    let storeRepository;
    let categoryRepository;
    let fileService;
    let useCase;

    beforeEach(() => {
        storeRepository = {
            findById: jest.fn(),
            updateById: jest.fn(),
        };
        categoryRepository = {
            findById: jest.fn(),
        };
        fileService = {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
        };
        useCase = updateStoreUseCase(storeRepository, categoryRepository, fileService);
    });

    it('should update store successfully without new logo', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store', description: 'Updated description' };
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: 'https://example.com/old-logo.jpg',
        };
        const updatedStore = {
            ...existingStore,
            ...updateData,
        };

        storeRepository.findById.mockResolvedValue(existingStore);
        storeRepository.updateById.mockResolvedValue(updatedStore);

        const result = await useCase(storeId, updateData);

        expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
        expect(storeRepository.updateById).toHaveBeenCalledWith(
            storeId,
            createUpdateStoreDTO(updateData),
        );
        expect(fileService.uploadImage).not.toHaveBeenCalled();
        expect(fileService.deleteImage).not.toHaveBeenCalled();
        expect(result).toEqual(createStoreResponseDTO(updatedStore));
    });

    it('should update store with new logo and delete old one', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store' };
        const file = { filename: 'new-logo.jpg' };
        const newLogoUrl = 'https://example.com/new-logo.jpg';
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: 'https://example.com/old-logo.jpg',
        };
        const updatedStore = {
            ...existingStore,
            ...updateData,
            logo: newLogoUrl,
        };

        storeRepository.findById.mockResolvedValue(existingStore);
        fileService.uploadImage.mockResolvedValue(newLogoUrl);
        fileService.deleteImage.mockResolvedValue();
        storeRepository.updateById.mockResolvedValue(updatedStore);

        const result = await useCase(storeId, updateData, file);

        expect(fileService.uploadImage).toHaveBeenCalledWith(file, {
            folder: 'stores',
            prefix: 'logo',
        });
        expect(fileService.deleteImage).toHaveBeenCalledWith('https://example.com/old-logo.jpg');
        expect(storeRepository.updateById).toHaveBeenCalledWith(
            storeId,
            createUpdateStoreDTO({ ...updateData, logo: newLogoUrl }),
        );
        expect(result).toEqual(createStoreResponseDTO(updatedStore));
    });

    it('should update store with first logo (no old logo to delete)', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store' };
        const file = { filename: 'first-logo.jpg' };
        const newLogoUrl = 'https://example.com/first-logo.jpg';
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: null,
        };
        const updatedStore = {
            ...existingStore,
            ...updateData,
            logo: newLogoUrl,
        };

        storeRepository.findById.mockResolvedValue(existingStore);
        fileService.uploadImage.mockResolvedValue(newLogoUrl);
        storeRepository.updateById.mockResolvedValue(updatedStore);

        const result = await useCase(storeId, updateData, file);

        expect(fileService.uploadImage).toHaveBeenCalled();
        expect(fileService.deleteImage).not.toHaveBeenCalled();
        expect(result).toEqual(createStoreResponseDTO(updatedStore));
    });

    it('should handle old logo deletion errors gracefully', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store' };
        const file = { filename: 'new-logo.jpg' };
        const newLogoUrl = 'https://example.com/new-logo.jpg';
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: 'https://example.com/old-logo.jpg',
        };
        const updatedStore = {
            ...existingStore,
            ...updateData,
            logo: newLogoUrl,
        };

        storeRepository.findById.mockResolvedValue(existingStore);
        fileService.uploadImage.mockResolvedValue(newLogoUrl);
        fileService.deleteImage.mockRejectedValue(new Error('Delete failed'));
        storeRepository.updateById.mockResolvedValue(updatedStore);

        const result = await useCase(storeId, updateData, file);

        expect(log.warn).toHaveBeenCalledWith(
            'Could not delete old logo',
            expect.objectContaining({
                storeId,
                oldLogo: 'https://example.com/old-logo.jpg',
                error: 'Delete failed',
            }),
        );
        expect(result).toEqual(createStoreResponseDTO(updatedStore));
    });

    it('should throw error when store not found', async () => {
        const storeId = 'nonexistent';
        const updateData = { storeName: 'Updated Store' };

        storeRepository.findById.mockResolvedValue(null);

        await expect(useCase(storeId, updateData)).rejects.toThrow('Store not found.');
    });

    it('should throw error when storeId is not provided', async () => {
        const updateData = { storeName: 'Updated Store' };

        await expect(useCase(null, updateData)).rejects.toThrow('Store ID is required for update.');
        await expect(useCase('', updateData)).rejects.toThrow('Store ID is required for update.');
    });

    it('should throw error when no update fields provided', async () => {
        const storeId = 'store123';
        const updateData = {};
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: null,
        };

        storeRepository.findById.mockResolvedValue(existingStore);

        await expect(useCase(storeId, updateData)).rejects.toThrow(
            'At least one field (storeName, description, logo, categoryIds, seoTitle, seoDescription) must be provided for an update.',
        );
    });

    it('should handle file upload errors', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store' };
        const file = { filename: 'logo.jpg' };
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: null,
        };
        const uploadError = new Error('Upload failed');

        storeRepository.findById.mockResolvedValue(existingStore);
        fileService.uploadImage.mockRejectedValue(uploadError);

        await expect(useCase(storeId, updateData, file)).rejects.toThrow('Upload failed');
    });

    it('should handle repository update errors', async () => {
        const storeId = 'store123';
        const updateData = { storeName: 'Updated Store' };
        const existingStore = {
            id: storeId,
            storeName: 'Original Store',
            logo: null,
        };
        const updateError = new Error('Update failed');

        storeRepository.findById.mockResolvedValue(existingStore);
        storeRepository.updateById.mockRejectedValue(updateError);

        await expect(useCase(storeId, updateData)).rejects.toThrow('Update failed');
    });
});
