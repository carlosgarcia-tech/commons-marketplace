import ProductModel from '../models/ProductModel.js';
import { paginateQuery } from '../utils/pagination.js';

export const ProductRepositoryImpl = {
    async create(productData, session = null) {
        const product = new ProductModel(productData);
        await product.save({ session });
        return product.toObject();
    },

    async findById(productId) {
        return await ProductModel.findById(productId).lean();
    },

    async findByIdOrSlug(idOrSlug) {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
        if (isObjectId) {
            return await ProductModel.findById(idOrSlug).lean();
        }
        return await ProductModel.findOne({ slug: idOrSlug }).lean();
    },

    async findAll(filters = {}, options = { page: 1, limit: 10 }, sort = {}) {
        const queryFilters = { ...filters };
        if (!filters.status) {
            queryFilters.status = 'Active';
        }
        return paginateQuery(ProductModel, queryFilters, options, sort);
    },

    async findByStoreId(storeId, options = { page: 1, limit: 10 }, sort = {}) {
        return paginateQuery(ProductModel, { storeId, status: 'Active' }, options, sort);
    },

    async findAllByStoreId(storeId) {
        return await ProductModel.find({ storeId }).lean();
    },

    async findByCategoryId(categoryId, options = { page: 1, limit: 10 }, sort = {}) {
        return paginateQuery(ProductModel, { categoryId, status: 'Active' }, options, sort);
    },

    async findBySubCategoryId(subCategoryId, options = { page: 1, limit: 10 }, sort = {}) {
        return paginateQuery(ProductModel, { subCategoryId, status: 'Active' }, options, sort);
    },

    async findByCategoryAndSubCategory(
        categoryId,
        subCategoryId,
        options = { page: 1, limit: 10 },
        sort = {},
    ) {
        return paginateQuery(
            ProductModel,
            { categoryId, subCategoryId, status: 'Active' },
            options,
            sort,
        );
    },

    async updateById(productId, updateData) {
        return await ProductModel.findByIdAndUpdate(productId, updateData, { new: true }).lean();
    },

    async deleteById(productId, session = null) {
        return await ProductModel.findByIdAndDelete(productId, { session }).lean();
    },

    async softDeleteById(productId) {
        return await ProductModel.findByIdAndUpdate(
            productId,
            { status: 'Deleted' },
            { new: true },
        ).lean();
    },

    async deleteManyByStoreId(storeId, session = null) {
        return await ProductModel.deleteMany({ storeId }, { session });
    },

    async softDeleteManyByStoreId(storeId) {
        return await ProductModel.updateMany({ storeId }, { $set: { status: 'Deleted' } });
    },

    async count(filters = {}) {
        const queryFilters = { ...filters };
        if (!filters.status) {
            queryFilters.status = 'Active';
        }
        return await ProductModel.countDocuments(queryFilters);
    },

    async countByStoreId(storeId) {
        return await ProductModel.countDocuments({ storeId, status: 'Active' });
    },

    async countByCategoryId(categoryId) {
        return await ProductModel.countDocuments({ categoryId, status: 'Active' });
    },

    async countBySubCategoryId(subCategoryId) {
        return await ProductModel.countDocuments({ subCategoryId, status: 'Active' });
    },

    async searchProducts(searchTerm, filters = {}, options = { page: 1, limit: 10 }, sort = {}) {
        const searchFilter = {
            status: 'Active',
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { categoryName: { $regex: searchTerm, $options: 'i' } },
                { subCategoryName: { $regex: searchTerm, $options: 'i' } },
            ],
        };
        const queryFilters = { ...searchFilter, ...filters };
        return paginateQuery(ProductModel, queryFilters, options, sort);
    },

    async findProductsByPriceRange(
        minPrice,
        maxPrice,
        filters = {},
        options = { page: 1, limit: 10 },
        sort = {},
    ) {
        const priceFilter = {
            status: 'Active',
            price: { $gte: minPrice, $lte: maxPrice },
        };
        const queryFilters = { ...priceFilter, ...filters };
        return paginateQuery(ProductModel, queryFilters, options, sort);
    },

    async findProductsWithCategoryInfo(filters = {}, options = { page: 1, limit: 10 }, sort = {}) {
        const queryFilters = { ...filters };
        if (!filters.status) {
            queryFilters.status = 'Active';
        }
        return paginateQuery(ProductModel, queryFilters, options, sort);
    },
};
