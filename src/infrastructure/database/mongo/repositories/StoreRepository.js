import StoreModel from '../models/StoreModel.js';

export const StoreRepositoryImpl = {
    async create(storeData) {
        const store = new StoreModel(storeData);
        await store.save();
        return store.toObject();
    },

    async findById(storeId) {
        return await StoreModel.findById(storeId).lean();
    },

    async findByIdOrSlug(idOrSlug) {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
        if (isObjectId) {
            return await StoreModel.findById(idOrSlug).lean();
        }
        return await StoreModel.findOne({ slug: idOrSlug }).lean();
    },

    async findByUserId(userId) {
        return await StoreModel.findOne({ userId: userId }).lean();
    },

    async findAllByUserId(userId) {
        return await StoreModel.find({ userId: userId }).lean();
    },

    async countByUserId(userId) {
        return await StoreModel.countDocuments({ userId: userId });
    },

    async findAll() {
        return await StoreModel.find({ status: 'Approved' }).sort({ createdAt: -1 }).lean();
    },

    async updateById(storeId, updateData) {
        return await StoreModel.findByIdAndUpdate(storeId, updateData, {
            new: true,
        }).lean();
    },

    async updateByUserId(userId, updateData) {
        return await StoreModel.findOneAndUpdate({ userId: userId }, updateData, {
            new: true,
        }).lean();
    },

    async deleteById(storeId) {
        return await StoreModel.findByIdAndDelete(storeId).lean();
    },

    async deleteByUserId(userId) {
        return await StoreModel.findOneAndDelete({ userId: userId }).lean();
    },

    async findAllPending() {
        return await StoreModel.find({ status: 'Pending' }).sort({ createdAt: -1 }).lean();
    },

    async findAllByStatus(status) {
        return await StoreModel.find({ status }).sort({ createdAt: -1 }).lean();
    },

    async updateStatus(storeId, status, reason = null) {
        const updateData = { status };
        if (reason) {
            updateData.statusReason = reason;
        }
        return await StoreModel.findByIdAndUpdate(storeId, updateData, { new: true }).lean();
    },

    async countByStatus(status) {
        return await StoreModel.countDocuments({ status });
    },

    async findByCategoryId(categoryId) {
        return await StoreModel.find({
            categoryIds: categoryId,
            status: 'Approved',
        }).lean();
    },

    async findAllWithCategory(categoryId) {
        return await StoreModel.find({
            categoryIds: categoryId,
        })
            .sort({ createdAt: -1 })
            .lean();
    },

    async incrementProductCount(storeId) {
        return await StoreModel.findByIdAndUpdate(
            storeId,
            { $inc: { productCount: 1 } },
            { new: true },
        ).lean();
    },

    async decrementProductCount(storeId) {
        return await StoreModel.findByIdAndUpdate(
            storeId,
            { $inc: { productCount: -1 } },
            { new: true },
        ).lean();
    },
};
