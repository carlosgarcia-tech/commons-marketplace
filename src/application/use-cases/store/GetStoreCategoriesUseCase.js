import { log } from '../../../infrastructure/logger/logger.js';

/**
 * Use case for getting store categories with product counts.
 * @param {object} storeRepository - The repository for store data.
 * @param {object} productRepository - The repository for product data.
 * @param {object} categoryRepository - The repository for category data.
 * @returns {Function} A function to execute the use case.
 */
export const getStoreCategoriesUseCase =
    (storeRepository, productRepository, categoryRepository) => async (storeId) => {
        log.info('Getting store categories', { storeId });

        const store = await storeRepository.findById(storeId);
        if (!store) {
            throw new Error('Store not found');
        }

        const categoryIds = store.categoryIds || [];

        if (categoryIds.length === 0) {
            return {
                storeId: store._id,
                storeName: store.storeName,
                categories: [],
            };
        }

        const categoriesWithCounts = await Promise.all(
            categoryIds.map(async (categoryId) => {
                const category = await categoryRepository.findById(categoryId);
                if (!category) return null;

                const products = await productRepository.findAll({
                    categoryId: categoryId.toString(),
                    storeId,
                });
                const productCount = products.totalItems || 0;

                return {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    productCount,
                };
            }),
        );

        const filteredCategories = categoriesWithCounts.filter((cat) => cat !== null);

        log.info('Store categories fetched successfully', {
            storeId,
            categoryCount: filteredCategories.length,
        });

        return {
            storeId: store._id,
            storeName: store.storeName,
            categories: filteredCategories,
        };
    };
