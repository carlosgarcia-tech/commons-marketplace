import supabase from '../../infrastructure/supabase/config/supabaseClient.js';

/**
 * Attempts to extract user from Authorization header without throwing if missing.
 * Returns the Supabase user object or null if no valid token.
 */
async function optionalAuth(req) {
    const token = req.headers?.authorization?.split(' ')[1];
    if (!token) return null;
    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) return null;
        return data.user;
    } catch {
        return null;
    }
}

/**
 * Factory function to create a store controller.
 * @param {object} useCases - An object containing all store-related use cases.
 * @param {Function} useCases.createStoreUseCase - Use case for creating a store.
 * @param {Function} useCases.getMyStoresUseCase - Use case for getting user's stores.
 * @param {Function} useCases.getAllStoresUseCase - Use case for getting all stores.
 * @param {Function} useCases.getStoreByIdUseCase - Use case for getting store by id.
 * @param {Function} useCases.updateStoreUseCase - Use case for updating a store.
 * @param {Function} useCases.deleteStoreUseCase - Use case for deleting a store.
 * @param {Function} useCases.getPendingStoresUseCase - Use case for getting pending stores (admin only).
 * @param {Function} useCases.getStoresByStatusUseCase - Use case for getting stores by status (admin only).
 * @param {Function} useCases.updateStoreStatusUseCase - Use case for updating store status (admin only).
 * @param {Function} useCases.getStoreCategoriesUseCase - Use case for getting store categories.
 * @returns {object} An object with controller methods for store operations.
 */
export function createStoreController({
    createStoreUseCase,
    getMyStoresUseCase,
    getAllStoresUseCase,
    getStoreByIdUseCase,
    updateStoreUseCase,
    deleteStoreUseCase,
    getPendingStoresUseCase,
    getStoresByStatusUseCase,
    updateStoreStatusUseCase,
    getStoreCategoriesUseCase,
}) {
    return {
        /**
         * Handles the request to create a new store for the authenticated user.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async createStore(req, res, next) {
            try {
                const userId = req.user.id;
                const { storeName, description, categoryIds, seoTitle, seoDescription } = req.body;
                const file = req.file;

                const storeData = {
                    userId,
                    storeName,
                    description,
                    categoryIds,
                    seoTitle,
                    seoDescription,
                };

                const newStore = await createStoreUseCase(storeData, file);
                res.status(201).json(newStore);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to get all stores owned by the authenticated user.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async getMyStores(req, res, next) {
            try {
                const userId = req.user.id;
                const stores = await getMyStoresUseCase(userId);
                res.status(200).json(stores);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the public request to get all approved stores.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async getAllStores(req, res, next) {
            try {
                const { categoryId } = req.query;
                const filters = categoryId ? { categoryId } : {};
                const stores = await getAllStoresUseCase(filters);
                res.status(200).json(stores);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to update a store.
         * Can be performed by the owner or admin.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async updateStore(req, res, next) {
            try {
                const storeId = req.params.id;
                const updateData = req.body;
                const file = req.file;

                const updatedStore = await updateStoreUseCase(storeId, updateData, file);

                if (!updatedStore) {
                    return res.status(404).json({ message: 'Store not found.' });
                }

                res.status(200).json(updatedStore);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to delete a store.
         * Can be performed by the owner or admin.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async deleteStore(req, res, next) {
            try {
                const storeId = req.params.id;
                const result = await deleteStoreUseCase(storeId);

                if (result.isErr) {
                    return res.status(result.error.statusCode || 500).json({
                        error: result.error.code,
                        message: result.error.message,
                    });
                }

                if (!result.value) {
                    return res.status(404).json({ message: 'Store not found.' });
                }

                res.status(204).send();
            } catch (error) {
                next(error);
            }
        },
        /**
         * Handles the public request to get a store by ID.
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async getStoreById(req, res, next) {
            try {
                const idOrSlug = req.params.idOrSlug;
                const store = await getStoreByIdUseCase(idOrSlug);

                if (!store) {
                    return res.status(404).json({ message: 'Store not found.' });
                }

                // Public access: only return Approved stores.
                // Authenticated owner/admin can see all statuses.
                if (store.status !== 'Approved') {
                    const supabaseUser = await optionalAuth(req);
                    if (supabaseUser) {
                        const UserRepositoryImpl = (
                            await import(
                                '../../infrastructure/database/mongo/repositories/userRepository.js'
                            )
                        ).UserRepositoryImpl;
                        const mongoUser = await UserRepositoryImpl.findById(supabaseUser.id);
                        const isOwner = mongoUser && mongoUser._id === store.userId;
                        const isAdmin = mongoUser && mongoUser.role === 'Admin';
                        if (!isOwner && !isAdmin) {
                            return res.status(404).json({ message: 'Store not found.' });
                        }
                    } else {
                        return res.status(404).json({ message: 'Store not found.' });
                    }
                }

                res.status(200).json(store);
            } catch (error) {
                next(error);
            }
        },
        /**
         * Handles the request to get all pending stores (admin only).
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async getPendingStores(req, res, next) {
            try {
                const stores = await getPendingStoresUseCase();
                res.status(200).json(stores);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to get stores by status (admin only).
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async getStoresByStatus(req, res, next) {
            try {
                const { status } = req.params;
                const stores = await getStoresByStatusUseCase(status);
                res.status(200).json(stores);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to update a store's status (admin only).
         * @param {object} req - The Express request object.
         * @param {object} res - The Express response object.
         * @param {Function} next - The Express next middleware function.
         * @returns {Promise<void>}
         */
        async updateStoreStatus(req, res, next) {
            try {
                const storeId = req.params.id;
                const { status, reason } = req.body;

                const updateData = { status };
                if (reason) updateData.reason = reason;

                const updatedStore = await updateStoreStatusUseCase(storeId, updateData);

                if (!updatedStore) {
                    return res.status(404).json({ message: 'Store not found.' });
                }

                res.status(200).json(updatedStore);
            } catch (error) {
                next(error);
            }
        },

        async getStoreCategories(req, res, next) {
            try {
                const storeId = req.params.id;
                const categories = await getStoreCategoriesUseCase(storeId);
                res.status(200).json(categories);
            } catch (error) {
                if (error.message === 'Store not found') {
                    return res.status(404).json({ message: 'Store not found.' });
                }
                next(error);
            }
        },
    };
}
