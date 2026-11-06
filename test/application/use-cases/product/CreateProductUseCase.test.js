import { createProductUseCase } from '../../../../src/application/use-cases/product/CreateProductUseCase.js';
import { createProductResponseDTO } from '../../../../src/application/dtos/products/ProductResponseDTO.js';
import { uploadImage, uploadMultipleImages } from '../../../../src/core/services/fileService.js';
import { log } from '../../../../src/infrastructure/logger/logger.js';
import { jest } from '@jest/globals';

jest.mock('../../../../src/core/services/fileService.js');

describe('CreateProductUseCase Tests', () => {
    let productRepository;
    let storeRepository;
    let categoryRepository;
    let useCase;

    beforeEach(() => {
        productRepository = {
            create: jest.fn(),
        };
        storeRepository = {
            findByIdOrSlug: jest.fn(),
            incrementProductCount: jest.fn(),
        };
        categoryRepository = {
            findById: jest.fn(),
        };
        useCase = createProductUseCase(productRepository, storeRepository, categoryRepository);

        jest.clearAllMocks();
    });

    it('should create a product with main image and return it', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const mockProduct = {
            ...productData,
            id: '1',
            mainImageUrl: 'https://example.com/main.jpg',
            imageUrls: [],
        };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: [],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(mockCategory);
        uploadImage.mockResolvedValue('https://example.com/main.jpg');
        productRepository.create.mockResolvedValue(mockProduct);

        const result = await useCase(productData, mainImageFile);

        expect(storeRepository.findByIdOrSlug).toHaveBeenCalledWith('store1');
        expect(categoryRepository.findById).toHaveBeenCalledWith('cat1');
        expect(storeRepository.incrementProductCount).toHaveBeenCalledWith('store1');
        expect(uploadImage).toHaveBeenCalledWith(mainImageFile, {
            folder: 'products',
            prefix: 'main',
        });
        expect(productRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test Product',
                description: 'A product for testing',
                price: 100,
                stock: 10,
                categoryId: 'cat1',
                sellerId: 'seller1',
                storeId: 'store1',
                mainImageUrl: 'https://example.com/main.jpg',
                imageUrls: [],
                subCategoryId: null,
            }),
        );
        expect(result.isOk).toBe(true);
        expect(result.value).toEqual(createProductResponseDTO(mockProduct));

        expect(log.info).toHaveBeenCalledWith('Creating new product', {
            productName: 'Test Product',
            sellerId: 'seller1',
            storeId: 'store1',
        });
        expect(log.info).toHaveBeenCalledWith('Product created successfully', {
            productId: '1',
            productName: 'Test Product',
        });
    });

    it('should create a product with main image and additional images', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const additionalImagesFiles = [{ filename: 'img1.jpg' }, { filename: 'img2.jpg' }];

        const additionalImageUrls = [
            'https://example.com/img1.jpg',
            'https://example.com/img2.jpg',
        ];

        const mockProduct = {
            ...productData,
            id: '1',
            mainImageUrl: 'https://example.com/main.jpg',
            imageUrls: additionalImageUrls,
            categoryName: 'Electronics',
            subCategoryName: null,
        };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: [],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(mockCategory);
        uploadImage.mockResolvedValue('https://example.com/main.jpg');
        uploadMultipleImages.mockResolvedValue(additionalImageUrls);
        productRepository.create.mockResolvedValue(mockProduct);

        const result = await useCase(productData, mainImageFile, additionalImagesFiles);

        expect(uploadImage).toHaveBeenCalledWith(mainImageFile, {
            folder: 'products',
            prefix: 'main',
        });
        expect(uploadMultipleImages).toHaveBeenCalledWith(additionalImagesFiles, {
            folder: 'products',
            prefix: 'gallery',
        });
        expect(result.isOk).toBe(true);
        expect(result.value).toEqual(createProductResponseDTO(mockProduct));

        expect(log.debug).toHaveBeenCalledWith('Uploading additional images', { count: 2 });
    });

    it('should create a product with valid subcategory', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            subCategoryId: 'sub1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const mockProduct = {
            ...productData,
            id: '1',
            mainImageUrl: 'https://example.com/main.jpg',
            imageUrls: [],
            categoryName: 'Electronics',
            subCategoryName: 'Smartphones',
        };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: ['cat1'],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        const mockSubCategory = {
            id: 'sub1',
            name: 'Smartphones',
            isActive: true,
            parent: 'cat1',
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById
            .mockResolvedValueOnce(mockCategory)
            .mockResolvedValueOnce(mockSubCategory);
        uploadImage.mockResolvedValue('https://example.com/main.jpg');
        productRepository.create.mockResolvedValue(mockProduct);

        const result = await useCase(productData, mainImageFile);

        expect(categoryRepository.findById).toHaveBeenCalledWith('sub1');
        expect(productRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Test Product',
                description: 'A product for testing',
                price: 100,
                stock: 10,
                categoryId: 'cat1',
                subCategoryId: 'sub1',
                sellerId: 'seller1',
                storeId: 'store1',
                mainImageUrl: 'https://example.com/main.jpg',
                imageUrls: [],
            }),
        );
        expect(result.isOk).toBe(true);
        expect(result.value).toEqual(createProductResponseDTO(mockProduct));

        expect(log.debug).toHaveBeenCalledWith('Validating subcategory', { subCategoryId: 'sub1' });
    });

    it('should limit additional images to 5', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const additionalImagesFiles = Array.from({ length: 7 }, (_, i) => ({
            filename: `img${i}.jpg`,
        }));

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: [],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(mockCategory);
        uploadImage.mockResolvedValue('https://example.com/main.jpg');
        uploadMultipleImages.mockResolvedValue([]);
        productRepository.create.mockResolvedValue({});

        const result = await useCase(productData, mainImageFile, additionalImagesFiles);

        expect(uploadMultipleImages).toHaveBeenCalledWith(additionalImagesFiles.slice(0, 5), {
            folder: 'products',
            prefix: 'gallery',
        });
        expect(log.debug).toHaveBeenCalledWith('Uploading additional images', { count: 5 });
        expect(result.isOk).toBe(true);
    });

    it('should return an error if main image is not provided', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const result = await useCase(productData, null);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Main product image is required');
        expect(result.error.statusCode).toBe(422);

        expect(log.warn).toHaveBeenCalledWith('Product creation failed: Main image not provided');
    });

    it('should return an error if storeId is not provided', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe(
            'Store ID is required. Products must be associated with a store.',
        );

        expect(log.warn).toHaveBeenCalledWith('Product creation failed: Store ID not provided');
    });

    it('should return an error if categoryId is not provided', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe(
            'Category ID is required. Products must be associated with a category.',
        );

        expect(log.warn).toHaveBeenCalledWith('Product creation failed: Category ID not provided');
    });

    it('should return an error if store not found', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        storeRepository.findByIdOrSlug.mockResolvedValue(null);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Store not found.');
        expect(result.error.statusCode).toBe(404);

        expect(log.warn).toHaveBeenCalledWith('Store not found', { storeIdOrSlug: 'store1' });
    });

    it('should return an error if store does not belong to seller', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'different-seller',
            status: 'Approved',
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('You can only create products for your own stores.');
        expect(result.error.statusCode).toBe(403);

        expect(log.warn).toHaveBeenCalledWith('Store ownership validation failed', {
            storeUserId: 'different-seller',
            sellerId: 'seller1',
        });
    });

    it('should return an error if store is not approved', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Pending',
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe(
            'Cannot create products for a store with status: Pending. Store must be Approved.',
        );
        expect(result.error.statusCode).toBe(422);

        expect(log.warn).toHaveBeenCalledWith('Store not approved', {
            storeId: 'store1',
            status: 'Pending',
        });
    });

    it('should return an error if category not found', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(null);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Category not found or inactive.');
        expect(result.error.statusCode).toBe(404);

        expect(log.warn).toHaveBeenCalledWith('Category not found or inactive', {
            categoryId: 'cat1',
        });
    });

    it('should return an error if subcategory does not belong to category', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            subCategoryId: 'sub1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: ['cat1'],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        const mockSubCategory = {
            id: 'sub1',
            name: 'Smartphones',
            isActive: true,
            parent: 'different-category',
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById
            .mockResolvedValueOnce(mockCategory)
            .mockResolvedValueOnce(mockSubCategory);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Subcategory does not belong to the selected category.');
        expect(result.error.statusCode).toBe(422);

        expect(log.warn).toHaveBeenCalledWith('Subcategory does not belong to category', {
            subCategoryId: 'sub1',
            categoryId: 'cat1',
            subCategoryParent: 'different-category',
        });
    });

    it('should handle image upload errors', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const error = new Error('Upload failed');

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: [],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(mockCategory);
        uploadImage.mockRejectedValue(error);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Failed to create product: Upload failed');
        expect(result.error.statusCode).toBe(500);

        expect(log.error).toHaveBeenCalledWith(
            'Error in createProductUseCase',
            expect.objectContaining({
                error: 'Upload failed',
            }),
        );
    });

    it('should handle repository errors', async () => {
        const productData = {
            name: 'Test Product',
            description: 'A product for testing',
            price: 100,
            stock: 10,
            categoryId: 'cat1',
            sellerId: 'seller1',
            storeId: 'store1',
        };

        const mainImageFile = { filename: 'main.jpg' };
        const error = new Error('DB error');

        const mockStore = {
            _id: 'store1',
            id: 'store1',
            userId: 'seller1',
            status: 'Approved',
            categoryIds: [],
        };

        const mockCategory = {
            id: 'cat1',
            name: 'Electronics',
            isActive: true,
        };

        storeRepository.findByIdOrSlug.mockResolvedValue(mockStore);
        categoryRepository.findById.mockResolvedValue(mockCategory);
        uploadImage.mockResolvedValue('https://example.com/main.jpg');
        productRepository.create.mockRejectedValue(error);

        const result = await useCase(productData, mainImageFile);

        expect(result.isErr).toBe(true);
        expect(result.error.message).toBe('Failed to create product: DB error');
        expect(result.error.statusCode).toBe(500);

        expect(log.error).toHaveBeenCalledWith(
            'Error in createProductUseCase',
            expect.objectContaining({
                error: 'DB error',
            }),
        );
    });
});
