import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: String,
                required: true,
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        lastMessageAt: {
            type: Date,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Canonical ordered key of the participant pair ("a|b"). Backs the
        // unique index that prevents duplicated conversations when two
        // find-or-create requests race.
        pairKey: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ pairKey: 1 }, { unique: true, sparse: true });

conversationSchema.pre('validate', function (next) {
    // eslint-disable-next-line no-invalid-this -- `this` is the Mongoose document
    if (Array.isArray(this.participants) && this.participants.length > 0) {
        // eslint-disable-next-line no-invalid-this -- idem
        this.pairKey = [...this.participants].map(String).sort().join('|');
    }
    next();
});

export default mongoose.model('Conversation', conversationSchema);
