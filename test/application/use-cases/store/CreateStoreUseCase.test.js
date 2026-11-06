import { createStoreUseCase } from '../../../../src/application/use-cases/store/CreateStoreUseCase.js';
import { createStoreResponseDTO } from '../../../../src/application/dtos/stores/index.js';

describe('CreateStoreUseCase Tests', () => {
    let storeRepository;
    let userRepository;
    let categoryRepository;
    let fileService;
    let useCase;

    beforeEach(() => {
        storeRepository = {
            countByUserId: jest.fn(),
            create: jest.fn(),
        };
        userRepository = {
            findById: jest.fn(),
        };
        categoryRepository = {
            findById: jest.fn(),
        };
        fileService = {
            uploadImage: jest.fn(),
        };
        useCase = createStoreUseCase(
            storeRepository,
            userRepository,
            categoryRepository,
            fileService,
        );
    });

    it('should create a store successfully without logo', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };

        const mockStore = {
            id: 'store123',
            ...storeData,
            logo: null,
            categoryIds: [],
            productCount: 0,
        };

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });
        storeRepository.countByUserId.mockResolvedValue(0);
        storeRepository.create.mockResolvedValue(mockStore);

        const result = await useCase(storeData);

        expect(userRepository.findById).toHaveBeenCalledWith('user123');
        expect(storeRepository.countByUserId).toHaveBeenCalledWith('user123');
        expect(storeRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user123',
                storeName: 'Test Store',
                description: 'Test description',
                logo: null,
                productCount: 0,
            }),
        );
        expect(result).toEqual(createStoreResponseDTO(mockStore));
        expect(fileService.uploadImage).not.toHaveBeenCalled();
    });

    it('should create a store successfully with logo', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };
        const file = { filename: 'logo.jpg' };
        const logoUrl = 'https://example.com/logo.jpg';

        const mockStore = {
            id: 'store123',
            ...storeData,
            logo: logoUrl,
            categoryIds: [],
            productCount: 0,
        };

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });
        storeRepository.countByUserId.mockResolvedValue(0);
        fileService.uploadImage.mockResolvedValue(logoUrl);
        storeRepository.create.mockResolvedValue(mockStore);

        const result = await useCase(storeData, file);

        expect(fileService.uploadImage).toHaveBeenCalledWith(file, {
            folder: 'stores',
            prefix: 'logo',
        });
        expect(storeRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user123',
                storeName: 'Test Store',
                description: 'Test description',
                logo: logoUrl,
                productCount: 0,
            }),
        );
        expect(result).toEqual(createStoreResponseDTO(mockStore));
    });

    it('should throw error when user is not a seller', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'buyer' });

        await expect(useCase(storeData)).rejects.toThrow(
            'You must be an approved seller to create a store.',
        );
    });

    it('should throw error when user has reached store limit', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });
        storeRepository.countByUserId.mockResolvedValue(2);

        await expect(useCase(storeData)).rejects.toThrow(
            'User has reached the maximum limit of 2 stores.',
        );
    });

    it('should throw error when user not found', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };

        userRepository.findById.mockResolvedValue(null);

        await expect(useCase(storeData)).rejects.toThrow('User not found');
    });

    it('should throw error when userId is missing', async () => {
        const storeData = {
            storeName: 'Test Store',
            description: 'Test description',
        };

        userRepository.findById.mockResolvedValue(null);

        await expect(useCase(storeData)).rejects.toThrow('User not found');
    });

    it('should throw error when storeName is missing', async () => {
        const storeData = {
            userId: 'user123',
            description: 'Test description',
        };

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });

        await expect(useCase(storeData)).rejects.toThrow(
            'userId and storeName are required to create a store.',
        );
    });

    it('should handle file upload errors', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };
        const file = { filename: 'logo.jpg' };
        const uploadError = new Error('Upload failed');

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });
        storeRepository.countByUserId.mockResolvedValue(0);
        fileService.uploadImage.mockRejectedValue(uploadError);

        await expect(useCase(storeData, file)).rejects.toThrow('Upload failed');
    });

    it('should handle repository errors', async () => {
        const storeData = {
            userId: 'user123',
            storeName: 'Test Store',
            description: 'Test description',
        };
        const repositoryError = new Error('Database error');

        userRepository.findById.mockResolvedValue({ _id: 'user123', role: 'seller' });
        storeRepository.countByUserId.mockResolvedValue(0);
        storeRepository.create.mockRejectedValue(repositoryError);

        await expect(useCase(storeData)).rejects.toThrow('Database error');
    });
});
