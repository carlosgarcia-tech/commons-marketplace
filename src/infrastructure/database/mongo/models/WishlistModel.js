import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
    },
    {
        _id: true,
    },
);

const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User',
            unique: true,
        },
        items: {
            type: [wishlistItemSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

wishlistSchema.index({ userId: 1 });

const WishlistModel = mongoose.model('Wishlist', wishlistSchema);
export default WishlistModel;
