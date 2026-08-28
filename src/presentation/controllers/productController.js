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
 * Factory function to create a product controller.
 * This controller handles HTTP requests for product operations including image uploads.
 * @param {object} dependencies - The dependencies object
 * @param {Function} dependencies.createProductUseCase - Use case for creating products
 * @param {Function} dependencies.getAllProductsUseCase - Use case for getting all products
 * @param {Function} dependencies.getProductByIdUseCase - Use case for getting product by ID
 * @param {Function} dependencies.updateProductUseCase - Use case for updating products
 * @param {Function} dependencies.deleteProductUseCase - Use case for deleting products
 * @param {Function} dependencies.getStoreProductsUseCase - Use case for getting products by store
 * @param {Function} dependencies.getRelatedProductsUseCase - Use case for getting related products
 * @param {Function} dependencies.searchProductsUseCase - Use case for searching products
 * @returns {object} Product controller methods
 */
export function createProductController({
    createProductUseCase,
    getAllProductsUseCase,
    getProductByIdUseCase,
    updateProductUseCase,
    deleteProductUseCase,
    getStoreProductsUseCase,
    getRelatedProductsUseCase,
    searchProductsUseCase,
}) {
    return {
        /**
         * Handles the request to create a new product with images.
         * The sellerId is automatically extracted from the authenticated user's token.
         * The storeId must be provided in the request body.
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async createProduct(req, res, next) {
            try {
                const sellerId = req.user.id;
                const {
                    name,
                    description,
                    price,
                    stock,
                    categoryId,
                    subCategoryId,
                    storeId,
                    storeSlug,
                } = req.body;

                const mainImageFile = req.files?.mainImage?.[0];
                const additionalImagesFiles = req.files?.additionalImages || [];

                const productData = {
                    name,
                    description,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    categoryId,
                    subCategoryId,
                    sellerId,
                    storeId: storeId || storeSlug,
                };

                const result = await createProductUseCase(
                    productData,
                    mainImageFile,
                    additionalImagesFiles,
                );

                if (result.isErr) {
                    return res.status(result.error.statusCode || 500).json({
                        error: result.error.code,
                        message: result.error.message,
                    });
                }

                res.status(201).json(result.value);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to get all products.
         * Pagination is REQUIRED (page and limit).
         * Filters are OPTIONAL (storeId, categoryId, subCategoryId, status, etc.).
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async getAllProducts(req, res, next) {
            try {
                const {
                    page: pageStr,
                    limit: limitStr,
                    sortBy,
                    order,
                    storeId,
                    categoryId,
                    subCategoryId,
                    status,
                    ...otherFilters
                } = req.query;

                if (!pageStr || !limitStr) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: 'Los parámetros "page" y "limit" son requeridos',
                        example: '/api/products?page=1&limit=10',
                    });
                }

                const page = parseInt(pageStr, 10);
                const limit = parseInt(limitStr, 10);

                if (isNaN(page) || page < 1) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: 'El parámetro "page" debe ser un número mayor o igual a 1',
                    });
                }

                if (isNaN(limit) || limit < 1 || limit > 100) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: 'El parámetro "limit" debe ser un número entre 1 y 100',
                    });
                }

                const filters = {};

                if (storeId) {
                    filters.storeId = storeId;
                }
                if (categoryId) {
                    filters.categoryId = categoryId;
                }
                if (subCategoryId) {
                    filters.subCategoryId = subCategoryId;
                }
                if (status) {
                    // Public access: only allow Active status
                    // Authenticated admins/sellers can filter by any status
                    if (status !== 'Active') {
                        const supabaseUser = await optionalAuth(req);
                        if (supabaseUser) {
                            const UserRepositoryImpl = (
                                await import(
                                    '../../infrastructure/database/mongo/repositories/userRepository.js'
                                )
                            ).UserRepositoryImpl;
                            const mongoUser = await UserRepositoryImpl.findById(supabaseUser.id);
                            const isAdmin = mongoUser && mongoUser.role === 'Admin';
                            // Sellers can filter their own products by any status
                            const isSeller =
                                mongoUser &&
                                (mongoUser.role === 'Seller' || mongoUser.isApprovedSeller);
                            if (!isAdmin && !isSeller) {
                                filters.status = 'Active';
                            } else {
                                filters.status = status;
                            }
                        } else {
                            filters.status = 'Active';
                        }
                    } else {
                        filters.status = status;
                    }
                } else {
                    // Default to Active for public access
                    const supabaseUser = await optionalAuth(req);
                    if (supabaseUser) {
                        const UserRepositoryImpl = (
                            await import(
                                '../../infrastructure/database/mongo/repositories/userRepository.js'
                            )
                        ).UserRepositoryImpl;
                        const mongoUser = await UserRepositoryImpl.findById(supabaseUser.id);
                        const isAdmin = mongoUser && mongoUser.role === 'Admin';
                        const isSeller =
                            mongoUser &&
                            (mongoUser.role === 'Seller' || mongoUser.isApprovedSeller);
                        if (!isAdmin && !isSeller) {
                            filters.status = 'Active';
                        }
                    } else {
                        filters.status = 'Active';
                    }
                }

                Object.assign(filters, otherFilters);

                const sortOptions = {};
                if (sortBy) {
                    const orderValue = order === 'desc' ? -1 : 1;
                    sortOptions[sortBy] = orderValue;
                }

                const paginatedResult = await getAllProductsUseCase(
                    filters,
                    { page, limit },
                    sortOptions,
                );

                res.status(200).json(paginatedResult);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to get all products from a specific store.
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async getStoreProducts(req, res, next) {
            try {
                const { storeIdOrSlug } = req.params;
                const { page: pageStr, limit: limitStr, sortBy, order } = req.query;

                const page = parseInt(pageStr, 10) || 1;
                const limit = parseInt(limitStr, 10) || 10;

                const sortOptions = {};
                if (sortBy) {
                    const orderValue = order === 'desc' ? -1 : 1;
                    sortOptions[sortBy] = orderValue;
                }

                const paginatedResult = await getStoreProductsUseCase(
                    storeIdOrSlug,
                    { page, limit },
                    sortOptions,
                );
                res.status(200).json(paginatedResult);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to get a single product by its ID.
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async getProductById(req, res, next) {
            try {
                const { idOrSlug } = req.params;
                const product = await getProductByIdUseCase(idOrSlug);
                if (!product) {
                    return res.status(404).json({ message: 'Product not found' });
                }

                // Public access: only return Active products.
                // Authenticated owner/admin can see all statuses.
                // Treat undefined/missing status as Active (model default).
                const productStatus = product.status || 'Active';
                if (productStatus !== 'Active') {
                    const supabaseUser = await optionalAuth(req);
                    if (supabaseUser) {
                        // Load the MongoDB profile to check ownership/role
                        const UserRepositoryImpl = (
                            await import(
                                '../../infrastructure/database/mongo/repositories/userRepository.js'
                            )
                        ).UserRepositoryImpl;
                        const mongoUser = await UserRepositoryImpl.findById(supabaseUser.id);
                        const isOwner = mongoUser && mongoUser._id === product.sellerId;
                        const isAdmin = mongoUser && mongoUser.role === 'Admin';
                        if (!isOwner && !isAdmin) {
                            return res.status(404).json({ message: 'Product not found' });
                        }
                    } else {
                        return res.status(404).json({ message: 'Product not found' });
                    }
                }

                res.status(200).json(product);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to update a product with optional new images.
         * Query param 'imageAction' can be: 'keep' (default), 'add', or 'replace'
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async updateProduct(req, res, next) {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const imageAction = req.query.imageAction || 'keep';

                if (updateData.categoryId) {
                    // The category name will be automatically obtained in the use case
                }
                if (updateData.subCategoryId) {
                    // The name of the subcategory will be automatically obtained in the use case
                }

                const newMainImageFile = req.files?.mainImage?.[0];
                const newAdditionalImagesFiles = req.files?.additionalImages || [];

                const updatedProduct = await updateProductUseCase(
                    id,
                    updateData,
                    newMainImageFile,
                    newAdditionalImagesFiles,
                    imageAction,
                );

                if (!updatedProduct) {
                    return res.status(404).json({ message: 'Product not found' });
                }

                res.status(200).json(updatedProduct);
            } catch (error) {
                next(error);
            }
        },

        /**
         * Handles the request to delete a product and its images.
         * @param {import('express').Request} req - The Express request object
         * @param {import('express').Response} res - The Express response object
         * @param {import('express').NextFunction} next - The Express next middleware function
         * @returns {Promise<void>}
         */
        async deleteProduct(req, res, next) {
            try {
                const { id } = req.params;
                const result = await deleteProductUseCase(id);

                if (result.isErr) {
                    return res.status(result.error.statusCode || 500).json({
                        error: result.error.code,
                        message: result.error.message,
                    });
                }

                if (!result.value) {
                    return res.status(404).json({ message: 'Product not found' });
                }
                res.status(204).send();
            } catch (error) {
                next(error);
            }
        },

        async getRelatedProducts(req, res, next) {
            try {
                const { id } = req.params;
                const { limit } = req.query;
                const limitNum = limit ? parseInt(limit) : 10;

                // First check if the base product exists and is Active (or user has access)
                const baseProduct = await getProductByIdUseCase(id);
                if (!baseProduct) {
                    return res.status(404).json({ message: 'Product not found' });
                }

                // Public access: only return related for Active products
                if (baseProduct.status !== 'Active') {
                    const supabaseUser = await optionalAuth(req);
                    if (supabaseUser) {
                        const UserRepositoryImpl = (
                            await import(
                                '../../infrastructure/database/mongo/repositories/userRepository.js'
                            )
                        ).UserRepositoryImpl;
                        const mongoUser = await UserRepositoryImpl.findById(supabaseUser.id);
                        const isOwner = mongoUser && mongoUser._id === baseProduct.sellerId;
                        const isAdmin = mongoUser && mongoUser.role === 'Admin';
                        if (!isOwner && !isAdmin) {
                            return res
                                .status(200)
                                .json({
                                    productId: id,
                                    categoryId: baseProduct.categoryId,
                                    products: [],
                                });
                        }
                    } else {
                        return res
                            .status(200)
                            .json({
                                productId: id,
                                categoryId: baseProduct.categoryId,
                                products: [],
                            });
                    }
                }

                const related = await getRelatedProductsUseCase(id, limitNum);
                res.status(200).json(related);
            } catch (error) {
                if (error.message === 'Product not found') {
                    return res.status(404).json({ message: 'Product not found' });
                }
                next(error);
            }
        },

        async searchProducts(req, res, next) {
            try {
                const {
                    q,
                    page: pageStr,
                    limit: limitStr,
                    categoryId,
                    subCategoryId,
                    sortBy,
                    order,
                } = req.query;
                const page = parseInt(pageStr, 10) || 1;
                const limit = parseInt(limitStr, 10) || 10;

                const sortOptions = {};
                if (sortBy) {
                    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
                }

                const filters = {};
                if (categoryId) filters.categoryId = categoryId;
                if (subCategoryId) filters.subCategoryId = subCategoryId;

                const results = await searchProductsUseCase(
                    q,
                    filters,
                    { page, limit },
                    sortOptions,
                );
                res.status(200).json(results);
            } catch (error) {
                next(error);
            }
        },
    };
}
