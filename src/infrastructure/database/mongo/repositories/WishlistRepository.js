import mongoose from 'mongoose';
import WishlistModel from '../models/WishlistModel.js';

export const WishlistRepositoryImpl = {
    async findByUserId(userId) {
        return await WishlistModel.findOne({ userId }).populate('items.productId').lean();
    },

    async findByUserIdSimple(userId) {
        return await WishlistModel.findOne({ userId }).lean();
    },

    async create(userId, session = null) {
        const wishlist = new WishlistModel({ userId, items: [] });
        await wishlist.save({ session });
        return wishlist.toObject();
    },

    async addItem(userId, productId, session = null) {
        const updateOptions = {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        };
        if (session) {
            updateOptions.session = session;
        }

        const updated = await WishlistModel.findOneAndUpdate(
            { userId },
            { $addToSet: { items: { productId } } },
            updateOptions,
        );

        return await WishlistModel.findById(updated._id).populate('items.productId').lean();
    },

    async removeItem(userId, productId, session = null) {
        const queryOptions = { new: true };
        if (session) {
            queryOptions.session = session;
        }

        const updated = await WishlistModel.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
            queryOptions,
        )
            .populate('items.productId')
            .lean();

        return updated;
    },

    async clear(userId, session = null) {
        const queryOptions = { new: true };
        if (session) {
            queryOptions.session = session;
        }

        const updated = await WishlistModel.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            queryOptions,
        );

        return updated?.toObject() ?? null;
    },

    async hasProduct(userId, productId) {
        const count = await WishlistModel.countDocuments({
            userId,
            'items.productId': new mongoose.Types.ObjectId(productId),
        });
        return count > 0;
    },
};
