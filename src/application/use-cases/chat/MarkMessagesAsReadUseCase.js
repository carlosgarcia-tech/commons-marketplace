import mongoose from 'mongoose';

export const markMessagesAsReadUseCase = ({
    messageRepository,
    conversationRepository,
    chatRepository,
}) => {
    const execute = async (conversationId, userId) => {
        // Validate conversationId format to prevent CastError
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            throw new Error('Invalid conversation ID format');
        }

        const updatedCount = await messageRepository.markAsRead(conversationId, userId);

        await conversationRepository.resetUnreadCount(conversationId, userId);

        const conversation = await conversationRepository.findById(conversationId);

        // Check if conversation exists and user is a participant
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant) {
            throw new Error('Not authorized to mark messages in this conversation');
        }

        const otherParticipantId = conversation.participants.find((p) => p.toString() !== userId);

        if (otherParticipantId) {
            await chatRepository.publishMessage(`private:${otherParticipantId}`, {
                type: 'messages_read',
                conversationId,
                readBy: userId,
            });
        }

        return {
            success: true,
            updatedCount,
        };
    };

    return { execute };
};
