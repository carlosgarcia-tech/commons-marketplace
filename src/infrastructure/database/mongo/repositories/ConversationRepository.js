import ConversationModel from '../models/ConversationModel.js';
import { createConversation } from '../../../../core/entities/Conversation.js';

/**
 * Create a new conversation
 * @description Creates a conversation between participants. If a concurrent
 * request already created the same pair (unique pairKey index), the existing
 * conversation is returned so find-or-create flows stay race-safe.
 * @param {object} conversationData - Conversation data
 * @returns {Promise<object>} Created (or existing) conversation
 */
export const create = async (conversationData) => {
    try {
        const conversation = await ConversationModel.create(conversationData);
        return createConversation(conversation.toObject());
    } catch (error) {
        if (error?.code === 11000) {
            const [participant1Id, participant2Id] = [...(conversationData.participants || [])]
                .map(String)
                .sort();
            const existing = await findByParticipants(participant1Id, participant2Id);
            if (existing) {
                return existing;
            }
        }
        throw error;
    }
};

/**
 * Find conversation by ID
 * @description Retrieves a conversation by its ID
 * @param {string} id - Conversation ID
 * @returns {Promise<object | null>} Conversation or null
 */
export const findById = async (id) => {
    const conversation = await ConversationModel.findById(id).populate('lastMessage').lean();
    return conversation ? createConversation(conversation) : null;
};

/**
 * Find conversation by participants
 * @description Finds a conversation between two users
 * @param {string} participant1Id - First participant ID
 * @param {string} participant2Id - Second participant ID
 * @returns {Promise<object | null>} Conversation or null
 */
export const findByParticipants = async (participant1Id, participant2Id) => {
    const conversation = await ConversationModel.findOne({
        participants: { $all: [participant1Id, participant2Id] },
    })
        .populate('lastMessage')
        .lean();

    return conversation ? createConversation(conversation) : null;
};

/**
 * Find conversations by user ID
 * @description Retrieves all conversations for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<object>} Conversations and pagination
 */
export const findByUserId = async (userId, options = { limit: 20, skip: 0 }) => {
    const { limit, skip } = options;
    const conversations = await ConversationModel.find({
        participants: userId,
    })
        .sort({ lastMessageAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('lastMessage')
        .lean();

    const total = await ConversationModel.countDocuments({
        participants: userId,
    });

    return {
        conversations: conversations.map(createConversation),
        total,
        hasMore: skip + conversations.length < total,
    };
};

/**
 * Update last message
 * @description Updates the last message reference in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @returns {Promise<object | null>} Updated conversation
 */
export const updateLastMessage = async (conversationId, messageId) => {
    const conversation = await ConversationModel.findByIdAndUpdate(
        conversationId,
        {
            lastMessage: messageId,
            lastMessageAt: new Date(),
        },
        { new: true },
    ).lean();
    return conversation ? createConversation(conversation) : null;
};

/**
 * Increment unread count
 * @description Atomically increments the unread message count for a user
 * using $inc, so concurrent message deliveries never lose counts.
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<object | null>} Updated conversation
 */
export const incrementUnreadCount = async (conversationId, userId) => {
    const conversation = await ConversationModel.findOneAndUpdate(
        { _id: conversationId },
        { $inc: { [`unreadCount.${userId}`]: 1 } },
        { new: true },
    )
        .populate('lastMessage')
        .lean();

    return conversation ? createConversation(conversation) : null;
};

/**
 * Reset unread count
 * @description Atomically resets the unread message count for a user to zero.
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<object | null>} Updated conversation
 */
export const resetUnreadCount = async (conversationId, userId) => {
    const conversation = await ConversationModel.findOneAndUpdate(
        { _id: conversationId },
        { $set: { [`unreadCount.${userId}`]: 0 } },
        { new: true },
    )
        .populate('lastMessage')
        .lean();

    return conversation ? createConversation(conversation) : null;
};

/**
 * Delete conversation
 * @description Deletes a conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteConversation = async (id) => {
    const result = await ConversationModel.findByIdAndDelete(id);
    return !!result;
};

export { deleteConversation as delete };
