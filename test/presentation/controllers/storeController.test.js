import { createStoreController } from '../../../src/presentation/controllers/storeController.js';

describe('StoreController', () => {
    let controller;
    let createStoreUseCase;
    let getMyStoresUseCase;
    let getAllStoresUseCase;
    let updateStoreUseCase;
    let deleteStoreUseCase;
    let req;
    let res;
    let next;

    beforeEach(() => {
        createStoreUseCase = jest.fn();
        getMyStoresUseCase = jest.fn();
        getAllStoresUseCase = jest.fn();
        updateStoreUseCase = jest.fn();
        deleteStoreUseCase = jest.fn();

        controller = createStoreController({
            createStoreUseCase,
            getMyStoresUseCase,
            getAllStoresUseCase,
            updateStoreUseCase,
            deleteStoreUseCase,
        });

        req = {
            body: {},
            params: {},
            user: { id: 'user123' },
            file: undefined,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createStore', () => {
        it('should create a store successfully with file and return 201 status', async () => {
            const storeData = {
                storeName: 'My Store',
                description: 'A great store',
            };
            const file = {
                filename: 'store-logo.jpg',
                path: '/uploads/store-logo.jpg',
            };
            const newStore = {
                id: 'store123',
                ...storeData,
                userId: 'user123',
                logo: file.path,
                createdAt: new Date(),
            };

            req.body = storeData;
            req.file = file;
            createStoreUseCase.mockResolvedValue(newStore);

            await controller.createStore(req, res, next);

            expect(createStoreUseCase).toHaveBeenCalledWith(
                {
                    userId: 'user123',
                    storeName: 'My Store',
                    description: 'A great store',
                },
                file,
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newStore);
            expect(next).not.toHaveBeenCalled();
        });

        it('should create a store successfully without file', async () => {
            const storeData = {
                storeName: 'My Store',
                description: 'A great store',
            };
            const newStore = {
                id: 'store123',
                ...storeData,
                userId: 'user123',
                createdAt: new Date(),
            };

            req.body = storeData;
            req.file = undefined;
            createStoreUseCase.mockResolvedValue(newStore);

            await controller.createStore(req, res, next);

            expect(createStoreUseCase).toHaveBeenCalledWith(
                {
                    userId: 'user123',
                    storeName: 'My Store',
                    description: 'A great store',
                },
                undefined,
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newStore);
        });

        it('should handle errors during store creation and call next', async () => {
            const storeData = { storeName: 'My Store' };
            const error = new Error('Database error');

            req.body = storeData;
            createStoreUseCase.mockRejectedValue(error);

            await controller.createStore(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should handle empty store data', async () => {
            const storeData = {};
            const newStore = {
                id: 'store123',
                storeName: '',
                userId: 'user123',
                createdAt: new Date(),
            };

            req.body = storeData;
            createStoreUseCase.mockResolvedValue(newStore);

            await controller.createStore(req, res, next);

            expect(createStoreUseCase).toHaveBeenCalledWith(
                {
                    userId: 'user123',
                    storeName: undefined,
                    description: undefined,
                },
                undefined,
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(newStore);
        });
    });

    describe('getMyStores', () => {
        it('should return stores when found for authenticated user', async () => {
            const stores = [
                {
                    id: 'store123',
                    storeName: 'My Store 1',
                    userId: 'user123',
                },
                {
                    id: 'store456',
                    storeName: 'My Store 2',
                    userId: 'user123',
                },
            ];

            getMyStoresUseCase.mockResolvedValue(stores);

            await controller.getMyStores(req, res, next);

            expect(getMyStoresUseCase).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(stores);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return empty array when no stores found for user', async () => {
            getMyStoresUseCase.mockResolvedValue([]);

            await controller.getMyStores(req, res, next);

            expect(getMyStoresUseCase).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during stores retrieval and call next', async () => {
            const error = new Error('Database connection failed');
            getMyStoresUseCase.mockRejectedValue(error);

            await controller.getMyStores(req, res, next);

            expect(getMyStoresUseCase).toHaveBeenCalledWith('user123');
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should handle different user IDs', async () => {
            const differentUserId = 'user456';
            req.user.id = differentUserId;
            const stores = [
                {
                    id: 'store456',
                    storeName: 'Different Store',
                    userId: differentUserId,
                },
            ];

            getMyStoresUseCase.mockResolvedValue(stores);

            await controller.getMyStores(req, res, next);

            expect(getMyStoresUseCase).toHaveBeenCalledWith(differentUserId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(stores);
        });
    });

    describe('getAllStores', () => {
        it('should return all approved stores paginated', async () => {
            const result = {
                data: [
                    {
                        id: 'store123',
                        storeName: 'Store 1',
                    },
                    {
                        id: 'store456',
                        storeName: 'Store 2',
                    },
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            getAllStoresUseCase.mockResolvedValue(result);

            req.query = {};

            await controller.getAllStores(req, res, next);

            expect(getAllStoresUseCase).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(result);
            expect(next).not.toHaveBeenCalled();
        });

        it('should pass categoryId and custom pagination from query', async () => {
            getAllStoresUseCase.mockResolvedValue({
                data: [],
                total: 0,
                page: 2,
                limit: 5,
                totalPages: 0,
            });
            req.query = { categoryId: 'cat123', page: '2', limit: '5' };

            await controller.getAllStores(req, res, next);

            expect(getAllStoresUseCase).toHaveBeenCalledWith(
                { categoryId: 'cat123' },
                { page: 2, limit: 5 },
            );
        });

        it('should return empty data when no approved stores exist', async () => {
            getAllStoresUseCase.mockResolvedValue({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            });
            req.query = {};

            await controller.getAllStores(req, res, next);

            expect(getAllStoresUseCase).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            });
        });

        it('should handle errors during stores retrieval and call next', async () => {
            const error = new Error('Database error');
            getAllStoresUseCase.mockRejectedValue(error);
            req.query = {};

            await controller.getAllStores(req, res, next);

            expect(getAllStoresUseCase).toHaveBeenCalledWith({}, { page: 1, limit: 10 });
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('updateStore', () => {
        it('should update store successfully with file and return updated store', async () => {
            const storeId = 'store123';
            const updateData = {
                storeName: 'Updated Store Name',
                description: 'Updated description',
            };
            const file = {
                filename: 'new-logo.jpg',
                path: '/uploads/new-logo.jpg',
            };
            const updatedStore = {
                id: storeId,
                ...updateData,
                logo: file.path,
                updatedAt: new Date(),
            };

            req.params.id = storeId;
            req.body = updateData;
            req.file = file;
            updateStoreUseCase.mockResolvedValue(updatedStore);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(storeId, updateData, file);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedStore);
            expect(next).not.toHaveBeenCalled();
        });

        it('should update store successfully without file', async () => {
            const storeId = 'store123';
            const updateData = {
                storeName: 'Updated Store Name',
                description: 'Updated description',
            };
            const updatedStore = {
                id: storeId,
                ...updateData,
                updatedAt: new Date(),
            };

            req.params.id = storeId;
            req.body = updateData;
            updateStoreUseCase.mockResolvedValue(updatedStore);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(storeId, updateData, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedStore);
        });

        it('should return 404 when store to update is not found', async () => {
            const storeId = 'nonexistent';
            const updateData = { storeName: 'New Name' };

            req.params.id = storeId;
            req.body = updateData;
            updateStoreUseCase.mockResolvedValue(null);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(storeId, updateData, undefined);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Store not found.',
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors during store update and call next', async () => {
            const storeId = 'store123';
            const updateData = { storeName: 'New Name' };
            const error = new Error('Update failed');

            req.params.id = storeId;
            req.body = updateData;
            updateStoreUseCase.mockRejectedValue(error);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(storeId, updateData, undefined);
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should handle partial update data', async () => {
            const storeId = 'store123';
            const partialUpdateData = { storeName: 'Only Name Updated' };
            const updatedStore = {
                id: storeId,
                storeName: 'Only Name Updated',
                updatedAt: new Date(),
            };

            req.params.id = storeId;
            req.body = partialUpdateData;
            updateStoreUseCase.mockResolvedValue(updatedStore);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(storeId, partialUpdateData, undefined);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(updatedStore);
        });
    });

    describe('deleteStore', () => {
        it('should delete store successfully and return 204 status', async () => {
            const storeId = 'store123';
            const deletedStore = {
                id: storeId,
                storeName: 'Deleted Store',
            };

            req.params.id = storeId;
            deleteStoreUseCase.mockResolvedValue({ isOk: true, isErr: false, value: deletedStore });

            await controller.deleteStore(req, res, next);

            expect(deleteStoreUseCase).toHaveBeenCalledWith(storeId);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 404 when store to delete is not found', async () => {
            const storeId = 'nonexistent';

            req.params.id = storeId;
            deleteStoreUseCase.mockResolvedValue({ isOk: true, isErr: false, value: null });

            await controller.deleteStore(req, res, next);

            expect(deleteStoreUseCase).toHaveBeenCalledWith(storeId);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Store not found.',
            });
            expect(res.send).not.toHaveBeenCalled();
        });

        it('should handle errors during store deletion and call next', async () => {
            const storeId = 'store123';
            const error = new Error('Deletion failed');

            req.params.id = storeId;
            deleteStoreUseCase.mockRejectedValue(error);

            await controller.deleteStore(req, res, next);

            expect(deleteStoreUseCase).toHaveBeenCalledWith(storeId);
            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        it('should handle different store IDs for deletion', async () => {
            const differentStoreId = 'store999';
            const deletedStore = {
                id: differentStoreId,
                storeName: 'Different Store',
            };

            req.params.id = differentStoreId;
            deleteStoreUseCase.mockResolvedValue({ isOk: true, isErr: false, value: deletedStore });

            await controller.deleteStore(req, res, next);

            expect(deleteStoreUseCase).toHaveBeenCalledWith(differentStoreId);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing user in request for createStore', async () => {
            req.user = undefined;
            req.body = { storeName: 'Test' };

            await controller.createStore(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(TypeError));
            const errorPassedToNext = next.mock.calls[0][0];
            expect(errorPassedToNext.message).toContain('Cannot read properties of undefined');
        });

        it('should handle missing user in request for getMyStores', async () => {
            req.user = undefined;

            await controller.getMyStores(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(TypeError));
            const errorPassedToNext = next.mock.calls[0][0];
            expect(errorPassedToNext.message).toContain('Cannot read properties of undefined');
        });

        it('should handle missing params.id for updateStore', async () => {
            req.params = {};
            req.body = { storeName: 'Test' };

            updateStoreUseCase.mockResolvedValue(null);

            await controller.updateStore(req, res, next);

            expect(updateStoreUseCase).toHaveBeenCalledWith(
                undefined,
                { storeName: 'Test' },
                undefined,
            );
        });

        it('should handle missing params.id for deleteStore', async () => {
            req.params = {};

            deleteStoreUseCase.mockResolvedValue({
                isErr: true,
                isOk: false,
                error: {
                    message: 'Store ID is required',
                    statusCode: 400,
                    code: 'VALIDATION_ERROR',
                },
            });

            await controller.deleteStore(req, res, next);

            expect(deleteStoreUseCase).toHaveBeenCalledWith(undefined);
        });

        it('should handle use cases throwing non-Error objects', async () => {
            req.body = { storeName: 'Test Store' };
            createStoreUseCase.mockRejectedValue('String error');

            await controller.createStore(req, res, next);

            expect(next).toHaveBeenCalledWith('String error');
        });

        it('should handle null response from use cases', async () => {
            getMyStoresUseCase.mockResolvedValue(null);

            await controller.getMyStores(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(null);
        });
    });

    describe('Response Format Validation', () => {
        it('should return stores array with correct structure in getMyStores', async () => {
            const stores = [
                {
                    id: 'store123',
                    storeName: 'Test Store',
                    description: 'Test Description',
                    userId: 'user123',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            getMyStoresUseCase.mockResolvedValue(stores);

            await controller.getMyStores(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(String),
                        storeName: expect.any(String),
                        userId: expect.any(String),
                    }),
                ]),
            );
        });

        it('should return created store with correct structure', async () => {
            const storeData = { storeName: 'New Store', description: 'Description' };
            const newStore = {
                id: 'store123',
                ...storeData,
                userId: 'user123',
                createdAt: new Date(),
            };

            req.body = storeData;
            createStoreUseCase.mockResolvedValue(newStore);

            await controller.createStore(req, res, next);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: expect.any(String),
                    storeName: 'New Store',
                    userId: 'user123',
                    createdAt: expect.any(Date),
                }),
            );
        });
    });
});
