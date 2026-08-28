import { createProductController } from '../../../src/presentation/controllers/productController.js';
import { jest } from '@jest/globals';

describe('ProductController Tests', () => {
    let req;
    let res;
    let next;
    let createProductUseCase;
    let getAllProductsUseCase;
    let getProductByIdUseCase;
    let updateProductUseCase;
    let deleteProductUseCase;
    let getStoreProductsUseCase;
    let productController;

    beforeEach(() => {
        req = { body: {}, params: {}, query: {}, files: {}, user: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        next = jest.fn();

        createProductUseCase = jest.fn();
        getAllProductsUseCase = jest.fn();
        getProductByIdUseCase = jest.fn();
        updateProductUseCase = jest.fn();
        deleteProductUseCase = jest.fn();
        getStoreProductsUseCase = jest.fn();

        productController = createProductController({
            createProductUseCase,
            getAllProductsUseCase,
            getProductByIdUseCase,
            updateProductUseCase,
            deleteProductUseCase,
            getStoreProductsUseCase,
        });

        jest.clearAllMocks();
    });

    describe('createProduct', () => {
        it('should return 201 with the created product on success', async () => {
            const mockProduct = { id: '1', name: 'Test Product' };
            req.body = {
                name: 'Test Product',
                price: '100',
                stock: '10',
                categoryId: 'cat1',
                subCategoryId: 'sub1',
                storeId: 'store1',
            };
            req.user = { id: 'seller123' };
            req.files = {
                mainImage: [{ filename: 'main.jpg' }],
                additionalImages: [{ filename: 'img1.jpg' }],
            };
            createProductUseCase.mockResolvedValue({
                isOk: true,
                isErr: false,
                value: mockProduct,
            });

            await productController.createProduct(req, res, next);

            expect(createProductUseCase).toHaveBeenCalledWith(
                {
                    name: 'Test Product',
                    description: undefined,
                    price: 100,
                    stock: 10,
                    categoryId: 'cat1',
                    subCategoryId: 'sub1',
                    sellerId: 'seller123',
                    storeId: 'store1',
                },
                { filename: 'main.jpg' },
                [{ filename: 'img1.jpg' }],
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockProduct);
        });

        it('should handle product without additional images', async () => {
            const mockProduct = { id: '1', name: 'Test Product' };
            req.body = {
                name: 'Test Product',
                price: '100',
                stock: '5',
                categoryId: 'cat1',
                storeId: 'store1',
            };
            req.user = { id: 'seller123' };
            req.files = {
                mainImage: [{ filename: 'main.jpg' }],
            };
            createProductUseCase.mockResolvedValue(mockProduct);

            await productController.createProduct(req, res, next);

            expect(createProductUseCase).toHaveBeenCalledWith(
                {
                    name: 'Test Product',
                    description: undefined,
                    price: 100,
                    stock: 5,
                    categoryId: 'cat1',
                    subCategoryId: undefined,
                    sellerId: 'seller123',
                    storeId: 'store1',
                },
                { filename: 'main.jpg' },
                [],
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Creation failed');
            req.body = {
                name: 'Test Product',
                price: '50',
                stock: '5',
                storeId: 'store1',
            };
            req.user = { id: 'seller123' };
            req.files = { mainImage: [{ filename: 'main.jpg' }] };
            createProductUseCase.mockRejectedValue(error);

            await productController.createProduct(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getAllProducts', () => {
        it('should return 200 with paginated products on success', async () => {
            const mockPaginatedResult = {
                products: [
                    { id: '1', name: 'Product 1' },
                    { id: '2', name: 'Product 2' },
                ],
                pagination: {
                    totalItems: 2,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            getAllProductsUseCase.mockResolvedValue(mockPaginatedResult);
            req.query = { page: '1', limit: '10' };

            await productController.getAllProducts(req, res, next);

            expect(getAllProductsUseCase).toHaveBeenCalledWith(
                { status: 'Active' },
                { page: 1, limit: 10 },
                {},
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPaginatedResult);
        });

        it('should handle filtering by storeId and categoryId', async () => {
            const mockPaginatedResult = {
                products: [{ id: '1', name: 'Product 1' }],
                pagination: {
                    totalItems: 1,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            getAllProductsUseCase.mockResolvedValue(mockPaginatedResult);
            req.query = {
                page: '1',
                limit: '10',
                storeId: 'store123',
                categoryId: 'cat456',
                subCategoryId: 'sub789',
            };

            await productController.getAllProducts(req, res, next);

            expect(getAllProductsUseCase).toHaveBeenCalledWith(
                {
                    storeId: 'store123',
                    categoryId: 'cat456',
                    subCategoryId: 'sub789',
                    status: 'Active',
                },
                { page: 1, limit: 10 },
                {},
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPaginatedResult);
        });

        it('should handle sorting parameters', async () => {
            const mockPaginatedResult = {
                products: [
                    { id: '1', name: 'Product 1', price: 20 },
                    { id: '2', name: 'Product 2', price: 10 },
                ],
                pagination: {
                    totalItems: 2,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            getAllProductsUseCase.mockResolvedValue(mockPaginatedResult);
            req.query = { page: '1', limit: '10', sortBy: 'price', order: 'desc' };

            await productController.getAllProducts(req, res, next);

            expect(getAllProductsUseCase).toHaveBeenCalledWith(
                { status: 'Active' },
                { page: 1, limit: 10 },
                { price: -1 },
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPaginatedResult);
        });

        it('should default to ascending order when order is not specified', async () => {
            const mockPaginatedResult = {
                products: [
                    { id: '1', name: 'Product A' },
                    { id: '2', name: 'Product B' },
                ],
                pagination: {
                    totalItems: 2,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            getAllProductsUseCase.mockResolvedValue(mockPaginatedResult);
            req.query = { page: '1', limit: '10', sortBy: 'name' };

            await productController.getAllProducts(req, res, next);

            expect(getAllProductsUseCase).toHaveBeenCalledWith(
                { status: 'Active' },
                { page: 1, limit: 10 },
                { name: 1 },
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 400 when page parameter is missing', async () => {
            req.query = { limit: '10' };

            await productController.getAllProducts(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Bad Request',
                message: 'Los parámetros "page" y "limit" son requeridos',
                example: '/api/products?page=1&limit=10',
            });
        });

        it('should return 400 when limit parameter is missing', async () => {
            req.query = { page: '1' };

            await productController.getAllProducts(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Bad Request',
                message: 'Los parámetros "page" y "limit" son requeridos',
                example: '/api/products?page=1&limit=10',
            });
        });

        it('should return 400 when page is invalid', async () => {
            req.query = { page: '0', limit: '10' };

            await productController.getAllProducts(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Bad Request',
                message: 'El parámetro "page" debe ser un número mayor o igual a 1',
            });
        });

        it('should return 400 when limit is too high', async () => {
            req.query = { page: '1', limit: '101' };

            await productController.getAllProducts(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Bad Request',
                message: 'El parámetro "limit" debe ser un número entre 1 y 100',
            });
        });

        it('should return 400 when limit is zero', async () => {
            req.query = { page: '1', limit: '0' };

            await productController.getAllProducts(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Bad Request',
                message: 'El parámetro "limit" debe ser un número entre 1 y 100',
            });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Failed to fetch');
            getAllProductsUseCase.mockRejectedValue(error);
            req.query = { page: '1', limit: '10' };

            await productController.getAllProducts(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getStoreProducts', () => {
        it('should return 200 with store products on success', async () => {
            const mockPaginatedResult = {
                products: [
                    { id: '1', name: 'Store Product 1' },
                    { id: '2', name: 'Store Product 2' },
                ],
                pagination: {
                    totalItems: 2,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            req.params.storeIdOrSlug = 'store123';
            req.query = { page: '1', limit: '10' };
            getStoreProductsUseCase.mockResolvedValue(mockPaginatedResult);

            await productController.getStoreProducts(req, res, next);

            expect(getStoreProductsUseCase).toHaveBeenCalledWith(
                'store123',
                { page: 1, limit: 10 },
                {},
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockPaginatedResult);
        });

        it('should handle sorting for store products', async () => {
            const mockPaginatedResult = {
                products: [{ id: '1', name: 'Store Product' }],
                pagination: {
                    totalItems: 1,
                    totalPages: 1,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            req.params.storeIdOrSlug = 'store123';
            req.query = { page: '1', limit: '10', sortBy: 'price', order: 'desc' };
            getStoreProductsUseCase.mockResolvedValue(mockPaginatedResult);

            await productController.getStoreProducts(req, res, next);

            expect(getStoreProductsUseCase).toHaveBeenCalledWith(
                'store123',
                { page: 1, limit: 10 },
                { price: -1 },
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should use default pagination when not provided', async () => {
            const mockPaginatedResult = {
                products: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: 1,
                    itemsPerPage: 10,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
            req.params.storeIdOrSlug = 'store123';
            req.query = {};
            getStoreProductsUseCase.mockResolvedValue(mockPaginatedResult);

            await productController.getStoreProducts(req, res, next);

            expect(getStoreProductsUseCase).toHaveBeenCalledWith(
                'store123',
                { page: 1, limit: 10 },
                {},
            );
        });
    });

    describe('getProductById', () => {
        it('should return 200 with the product on success', async () => {
            const mockProduct = { id: '1', name: 'Test Product' };
            req.params.idOrSlug = '1';
            getProductByIdUseCase.mockResolvedValue(mockProduct);

            await productController.getProductById(req, res, next);

            expect(getProductByIdUseCase).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProduct);
        });

        it('should return 404 if product is not found', async () => {
            req.params.idOrSlug = '1';
            getProductByIdUseCase.mockResolvedValue(null);

            await productController.getProductById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Failed to fetch by id');
            req.params.idOrSlug = '1';
            getProductByIdUseCase.mockRejectedValue(error);

            await productController.getProductById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('updateProduct', () => {
        it('should return 200 with the updated product on success', async () => {
            const mockProduct = { id: '1', name: 'Updated Product' };
            req.params.id = '1';
            req.body = { name: 'Updated Product', price: '150' };
            req.query = {};
            updateProductUseCase.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res, next);

            expect(updateProductUseCase).toHaveBeenCalledWith(
                '1',
                { name: 'Updated Product', price: '150' },
                undefined,
                [],
                'keep',
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProduct);
        });

        it('should handle main image update', async () => {
            const mockProduct = { id: '1', name: 'Updated Product' };
            req.params.id = '1';
            req.body = { name: 'Updated Product' };
            req.files = {
                mainImage: [{ filename: 'new-main.jpg' }],
            };
            req.query = { imageAction: 'keep' };
            updateProductUseCase.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res, next);

            expect(updateProductUseCase).toHaveBeenCalledWith(
                '1',
                { name: 'Updated Product' },
                { filename: 'new-main.jpg' },
                [],
                'keep',
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle additional images with replace action', async () => {
            const mockProduct = { id: '1', name: 'Updated Product' };
            req.params.id = '1';
            req.body = { name: 'Updated Product' };
            req.files = {
                additionalImages: [{ filename: 'img1.jpg' }, { filename: 'img2.jpg' }],
            };
            req.query = { imageAction: 'replace' };
            updateProductUseCase.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res, next);

            expect(updateProductUseCase).toHaveBeenCalledWith(
                '1',
                { name: 'Updated Product' },
                undefined,
                [{ filename: 'img1.jpg' }, { filename: 'img2.jpg' }],
                'replace',
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle add action for images', async () => {
            const mockProduct = { id: '1', name: 'Updated Product' };
            req.params.id = '1';
            req.body = { name: 'Updated Product' };
            req.files = {
                additionalImages: [{ filename: 'img1.jpg' }],
            };
            req.query = { imageAction: 'add' };
            updateProductUseCase.mockResolvedValue(mockProduct);

            await productController.updateProduct(req, res, next);

            expect(updateProductUseCase).toHaveBeenCalledWith(
                '1',
                { name: 'Updated Product' },
                undefined,
                [{ filename: 'img1.jpg' }],
                'add',
            );
        });

        it('should return 404 if product to update is not found', async () => {
            req.params.id = '1';
            req.body = { name: 'Updated Product' };
            req.query = {};
            updateProductUseCase.mockResolvedValue(null);

            await productController.updateProduct(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Update failed');
            req.params.id = '1';
            req.body = { name: 'Updated Product' };
            req.query = {};
            updateProductUseCase.mockRejectedValue(error);

            await productController.updateProduct(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteProduct', () => {
        it('should return 204 on successful deletion', async () => {
            req.params.id = '1';
            deleteProductUseCase.mockResolvedValue({
                isOk: true,
                isErr: false,
                value: { id: '1' },
            });

            await productController.deleteProduct(req, res, next);

            expect(deleteProductUseCase).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it('should return 404 if product to delete is not found', async () => {
            req.params.id = '1';
            deleteProductUseCase.mockResolvedValue({ isOk: true, isErr: false, value: null });

            await productController.deleteProduct(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found' });
        });

        it('should call next with error on failure', async () => {
            const error = new Error('Deletion failed');
            req.params.id = '1';
            deleteProductUseCase.mockRejectedValue(error);

            await productController.deleteProduct(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
