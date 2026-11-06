import { createCreateProductDTO, createProductResponseDTO } from '../../dtos/products/index.js';
import { uploadImage, uploadMultipleImages } from '../../../core/services/fileService.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { ok, err } from '../../../core/either/Result.js';
import {
    NotFoundError,
    ValidationError,
    UnauthorizedError,
    InfrastructureError,
} from '../../../core/errors/index.js';
import { invalidateCache } from '../../../infrastructure/cache/cacheManager.js';

/**
 * Use case for creating a new product with image uploads.
 * Validates that the store exists, is approved, and belongs to the seller.
 * Also validates that the category and subcategory exist and are related.
 * @param {object} productRepository - The repository for product data.
 * @param {object} storeRepository - The repository for store data.
 * @param {object} categoryRepository - The repository for category data.
 * @returns {Function} A function to execute the use case.
 */
export const createProductUseCase =
    (productRepository, storeRepository, categoryRepository) =>
    /**
     * Executes the create product use case.
     * @param {object} productData - The product data to create.
     * @param {object} mainImageFile - The main image file (required).
     * @param {Array} [additionalImagesFiles] - Additional image files (max 5).
     * @returns {Promise<object>} Ok with the created product DTO, or Err with a DomainError.
     */
    async (productData, mainImageFile, additionalImagesFiles = []) => {
        log.info('Creating new product', {
            productName: productData.name,
            sellerId: productData.sellerId,
            storeId: productData.storeId,
        });

        if (!mainImageFile) {
            log.warn('Product creation failed: Main image not provided');
            return err(new ValidationError('Main product image is required'));
        }

        if (!productData.storeId) {
            log.warn('Product creation failed: Store ID not provided');
            return err(
                new ValidationError(
                    'Store ID is required. Products must be associated with a store.',
                ),
            );
        }

        if (!productData.categoryId) {
            log.warn('Product creation failed: Category ID not provided');
            return err(
                new ValidationError(
                    'Category ID is required. Products must be associated with a category.',
                ),
            );
        }

        try {
            const storeIdOrSlug = productData.storeId || productData.storeSlug;
            log.debug('Validating store', { storeIdOrSlug });
            const store = await storeRepository.findByIdOrSlug(storeIdOrSlug);
            if (!store) {
                log.warn('Store not found', { storeIdOrSlug });
                return err(new NotFoundError('Store not found.'));
            }
            productData.storeId = store._id;

            if (store.userId !== productData.sellerId) {
                log.warn('Store ownership validation failed', {
                    storeUserId: store.userId,
                    sellerId: productData.sellerId,
                });
                return err(
                    new UnauthorizedError('You can only create products for your own stores.'),
                );
            }

            if (store.status !== 'Approved') {
                log.warn('Store not approved', {
                    storeId: store._id,
                    status: store.status,
                });
                return err(
                    new ValidationError(
                        `Cannot create products for a store with status: ${store.status}. Store must be Approved.`,
                    ),
                );
            }

            const categoryIds = store.categoryIds?.map((id) => id.toString()) || [];
            if (
                categoryIds.length > 0 &&
                !categoryIds.includes(productData.categoryId.toString())
            ) {
                log.warn('Product category not allowed for store', {
                    storeId: productData.storeId,
                    productCategory: productData.categoryId,
                    storeCategories: categoryIds,
                });
                return err(
                    new ValidationError(
                        "This category is not allowed for this store. Please select a category from the store's allowed categories.",
                    ),
                );
            }

            log.debug('Validating category', { categoryId: productData.categoryId });
            const category = await categoryRepository.findById(productData.categoryId);
            if (!category || !category.isActive) {
                log.warn('Category not found or inactive', { categoryId: productData.categoryId });
                return err(new NotFoundError('Category not found or inactive.'));
            }

            let subCategory = null;

            if (productData.subCategoryId) {
                log.debug('Validating subcategory', { subCategoryId: productData.subCategoryId });
                subCategory = await categoryRepository.findById(productData.subCategoryId);
                if (!subCategory || !subCategory.isActive) {
                    log.warn('Subcategory not found or inactive', {
                        subCategoryId: productData.subCategoryId,
                    });
                    return err(new NotFoundError('Subcategory not found or inactive.'));
                }

                if (subCategory.parent?.toString() !== productData.categoryId) {
                    log.warn('Subcategory does not belong to category', {
                        subCategoryId: productData.subCategoryId,
                        categoryId: productData.categoryId,
                        subCategoryParent: subCategory.parent,
                    });
                    return err(
                        new ValidationError(
                            'Subcategory does not belong to the selected category.',
                        ),
                    );
                }
            }

            log.debug('Uploading main image');
            const mainImageUrl = await uploadImage(mainImageFile, {
                folder: 'products',
                prefix: 'main',
            });

            let imageUrls = [];
            if (additionalImagesFiles && additionalImagesFiles.length > 0) {
                const filesToUpload = additionalImagesFiles.slice(0, 5);
                log.debug('Uploading additional images', { count: filesToUpload.length });
                imageUrls = await uploadMultipleImages(filesToUpload, {
                    folder: 'products',
                    prefix: 'gallery',
                });
            }

            const productDataWithImages = {
                ...productData,
                subCategoryId: productData.subCategoryId || null,
                mainImageUrl,
                imageUrls,
            };

            log.debug('Creating product in repository');
            const createProductDTO = createCreateProductDTO(productDataWithImages);
            const newProduct = await productRepository.create(createProductDTO);

            await storeRepository.incrementProductCount(productData.storeId);

            invalidateCache('products:');
            invalidateCache(`store:${productData.storeId}`);

            log.info('Product created successfully', {
                productId: newProduct.id,
                productName: newProduct.name,
            });

            return ok(createProductResponseDTO(newProduct));
        } catch (error) {
            log.error('Error in createProductUseCase', {
                error: error.message,
                stack: error.stack,
                productData: {
                    name: productData.name,
                    storeId: productData.storeId,
                    categoryId: productData.categoryId,
                },
            });
            return err(
                new InfrastructureError(`Failed to create product: ${error.message}`, error),
            );
        }
    };
