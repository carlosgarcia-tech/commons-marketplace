import { messageResponseDTO } from '../../dtos/messages/index.js';
import { log } from '../../../infrastructure/logger/logger.js';
import { forbiddenException, notFoundException } from '../../../presentation/exceptions/index.js';

export const getConversationMessagesUseCase = ({
    messageRepository,
    conversationRepository,
    userRepository,
    getUserBasicInfo,
}) => {
    const execute = async (conversationId, userId, options = {}) => {
        try {
            log.debug('Fetching conversation messages', { conversationId, userId, options });

            const conversation = await conversationRepository.findById(conversationId);

            if (!conversation) {
                throw notFoundException('Conversation not found');
            }

            const isParticipant = conversation.participants.some(
                (participant) => participant.toString() === userId,
            );

            if (!isParticipant) {
                throw forbiddenException('You are not a participant of this conversation');
            }

            const result = await messageRepository.findByConversationId(conversationId, options);

            const allUserIds = new Set();
            result.messages.forEach((msg) => {
                allUserIds.add(msg.senderId);
                allUserIds.add(msg.receiverId);
            });

            log.debug('Fetching user information', {
                conversationId,
                userCount: allUserIds.size,
            });

            const usersData = {};
            for (const userId of allUserIds) {
                try {
                    const user = await getUserBasicInfo(userId);
                    if (user) {
                        usersData[userId] = user;
                    }
                } catch (error) {
                    log.warn('User not found in database', {
                        userId,
                        conversationId,
                        error: error.message,
                    });
                }
            }

            const enrichedMessages = result.messages.map((message) =>
                messageResponseDTO(
                    message,
                    usersData[message.senderId],
                    usersData[message.receiverId],
                ),
            );

            log.info('Conversation messages retrieved successfully', {
                conversationId,
                messageCount: enrichedMessages.length,
                total: result.total,
                hasMore: result.hasMore,
            });

            return {
                messages: enrichedMessages,
                total: result.total,
                hasMore: result.hasMore,
            };
        } catch (error) {
            log.error('Error fetching conversation messages', {
                conversationId,
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    };

    return { execute };
};
