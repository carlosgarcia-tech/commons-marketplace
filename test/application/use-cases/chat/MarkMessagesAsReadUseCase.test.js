import { markMessagesAsReadUseCase } from '../../../../src/application/use-cases/chat/MarkMessagesAsReadUseCase.js';

describe('MarkMessagesAsReadUseCase', () => {
    let messageRepository;
    let conversationRepository;
    let chatRepository;
    let useCase;

    beforeEach(() => {
        messageRepository = {
            markAsRead: jest.fn(),
        };
        conversationRepository = {
            resetUnreadCount: jest.fn(),
            findById: jest.fn(),
        };
        chatRepository = {
            publishMessage: jest.fn(),
        };
        useCase = markMessagesAsReadUseCase({
            messageRepository,
            conversationRepository,
            chatRepository,
        });
    });

    describe('execute', () => {
        const validConvId = '507f1f77bcf86cd799439011';
        const validUserId = '507f1f77bcf86cd799439012';
        const otherUserId = '507f1f77bcf86cd799439013';

        it('should mark messages as read and notify other participant', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const updatedCount = 5;

            messageRepository.markAsRead.mockResolvedValue(updatedCount);
            conversationRepository.resetUnreadCount.mockResolvedValue();
            conversationRepository.findById.mockResolvedValue({
                participants: [userId, otherUserId],
            });
            chatRepository.publishMessage.mockResolvedValue();

            const result = await useCase.execute(conversationId, userId);

            expect(messageRepository.markAsRead).toHaveBeenCalledWith(conversationId, userId);
            expect(conversationRepository.resetUnreadCount).toHaveBeenCalledWith(
                conversationId,
                userId,
            );
            expect(conversationRepository.findById).toHaveBeenCalledWith(conversationId);
            expect(chatRepository.publishMessage).toHaveBeenCalledWith(`private:${otherUserId}`, {
                type: 'messages_read',
                conversationId,
                readBy: userId,
            });
            expect(result).toEqual({
                success: true,
                updatedCount: 5,
            });
        });

        it('should not publish message if no other participant found', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const updatedCount = 3;

            messageRepository.markAsRead.mockResolvedValue(updatedCount);
            conversationRepository.resetUnreadCount.mockResolvedValue();
            conversationRepository.findById.mockResolvedValue({
                participants: [userId],
            });

            const result = await useCase.execute(conversationId, userId);

            expect(chatRepository.publishMessage).not.toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                updatedCount: 3,
            });
        });

        it('should handle when no messages are updated', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const otherUserId = '507f1f77bcf86cd799439014';

            messageRepository.markAsRead.mockResolvedValue(0);
            conversationRepository.resetUnreadCount.mockResolvedValue();
            conversationRepository.findById.mockResolvedValue({
                participants: [userId, otherUserId],
            });
            chatRepository.publishMessage.mockResolvedValue();

            const result = await useCase.execute(conversationId, userId);

            expect(result).toEqual({
                success: true,
                updatedCount: 0,
            });
            expect(chatRepository.publishMessage).toHaveBeenCalled();
        });

        it('should throw an error if markAsRead fails', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const error = new Error('Database error');

            messageRepository.markAsRead.mockRejectedValue(error);

            await expect(useCase.execute(conversationId, userId)).rejects.toThrow('Database error');
        });

        it('should throw an error if resetUnreadCount fails', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const error = new Error('Reset failed');

            messageRepository.markAsRead.mockResolvedValue(5);
            conversationRepository.resetUnreadCount.mockRejectedValue(error);

            await expect(useCase.execute(conversationId, userId)).rejects.toThrow('Reset failed');
        });

        it('should throw an error if findById fails', async () => {
            const conversationId = validConvId;
            const userId = validUserId;
            const error = new Error('Conversation not found');

            messageRepository.markAsRead.mockResolvedValue(5);
            conversationRepository.resetUnreadCount.mockResolvedValue();
            conversationRepository.findById.mockRejectedValue(error);

            await expect(useCase.execute(conversationId, userId)).rejects.toThrow(
                'Conversation not found',
            );
        });
    });
});
