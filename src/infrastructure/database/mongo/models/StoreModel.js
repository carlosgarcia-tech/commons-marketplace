import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            ref: 'User',
        },
        storeName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
        },
        seoTitle: {
            type: String,
            required: false,
            maxlength: 70,
        },
        seoDescription: {
            type: String,
            required: false,
            maxlength: 160,
        },
        ogImage: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: false,
            default: '',
        },
        logo: {
            type: String,
            required: false,
            default: null,
        },
        status: {
            type: String,
            required: true,
            enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
            default: 'Pending',
        },
        statusReason: {
            type: String,
            required: false,
            maxlength: 500,
        },
        categoryIds: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Category',
                },
            ],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 5;
                },
                message: 'A store can have a maximum of 5 categories',
            },
        },
        allowedMainCategories: {
            type: [String],
            default: [],
        },
        productCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

storeSchema.index({ userId: 1 });
storeSchema.index({ userId: 1, storeName: 1 }, { unique: true });
storeSchema.index({ categoryIds: 1 });
storeSchema.index({ status: 1 });

const StoreModel = mongoose.model('Store', storeSchema);
export default StoreModel;
