import { badRequestException } from '../exceptions/index.js';
import { getWebSocketServer } from '../../infrastructure/websocket/socket-instance.js';

/**
 * Send message controller
 * @description Handles sending a new message
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const sendMessage = ({ sendMessageUseCase }) => {
    return async (req, res, next) => {
        try {
            const { receiverId, content, type, metadata } = req.body;
            const senderId = req.user.id;

            if (!receiverId || !content) {
                throw badRequestException('Receiver ID and content are required');
            }

            const message = await sendMessageUseCase.execute({
                senderId,
                receiverId,
                content,
                type,
                metadata,
            });

            const wsServer = getWebSocketServer();
            if (wsServer) {
                wsServer.emitToUser(receiverId, 'new-message', {
                    from: senderId,
                    message,
                    conversationId: message.conversationId,
                    timestamp: new Date().toISOString(),
                });
            }

            return res.status(201).json({
                success: true,
                data: message,
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Get conversation messages controller
 * @description Retrieves messages for a conversation
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const getConversationMessages = ({ getConversationMessagesUseCase }) => {
    return async (req, res, next) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;
            const { limit = 50, skip = 0 } = req.query;

            const result = await getConversationMessagesUseCase.execute(conversationId, userId, {
                limit: parseInt(limit),
                skip: parseInt(skip),
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Get user conversations controller
 * @description Retrieves all conversations for the current user
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const getUserConversations = ({ getUserConversationsUseCase }) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { limit = 20, skip = 0 } = req.query;

            const result = await getUserConversationsUseCase.execute(userId, {
                limit: parseInt(limit),
                skip: parseInt(skip),
            });

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Mark messages as read controller
 * @description Marks all messages in a conversation as read
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const markMessagesAsRead = ({ markMessagesAsReadUseCase }) => {
    return async (req, res, next) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            const result = await markMessagesAsReadUseCase.execute(conversationId, userId);

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Generate chat token controller
 * @description Generates an Ably token for the current user
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const generateChatToken = ({ generateChatTokenUseCase }) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;

            const tokenRequest = await generateChatTokenUseCase.execute(userId);

            return res.status(200).json({
                success: true,
                data: tokenRequest,
            });
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Get conversation by participant controller
 * @description Gets or creates a conversation with another user
 * @param {object} dependencies - Controller dependencies
 * @returns {Function} Express controller function
 */

export const getConversationByParticipant = ({ conversationRepository }) => {
    return async (req, res, next) => {
        try {
            const { participantId } = req.params;
            const userId = req.user.id;

            if (userId === participantId) {
                throw badRequestException('Cannot create conversation with yourself');
            }

            let conversation = await conversationRepository.findByParticipants(
                userId,
                participantId,
            );

            if (!conversation) {
                conversation = await conversationRepository.create({
                    participants: [userId, participantId],
                });
            }

            return res.status(200).json({
                success: true,
                data: conversation,
            });
        } catch (error) {
            next(error);
        }
    };
};
