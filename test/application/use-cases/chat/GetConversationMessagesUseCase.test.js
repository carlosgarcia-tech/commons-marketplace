import { getConversationMessagesUseCase } from '../../../../src/application/use-cases/chat/GetConversationMessagesUseCase.js';
import { messageResponseDTO } from '../../../../src/application/dtos/messages/index.js';
import { log } from '../../../../src/infrastructure/logger/logger.js';

jest.mock('../../../../src/application/dtos/messages/index.js', () => ({
    messageResponseDTO: jest.fn((msg) => ({ ...msg, formatted: true })),
}));

describe('getConversationMessagesUseCase', () => {
    let messageRepository;
    let conversationRepository;
    let getUserBasicInfo;
    let useCase;
    const requestUserId = 'user_123';
    const mockConversation = {
        id: 'conv_123',
        participants: ['user_123', 'user_456'],
    };

    beforeEach(() => {
        messageRepository = {
            findByConversationId: jest.fn(),
        };
        conversationRepository = {
            findById: jest.fn(),
        };
        conversationRepository.findById.mockResolvedValue(mockConversation);
        getUserBasicInfo = jest.fn();
        useCase = getConversationMessagesUseCase({
            messageRepository,
            conversationRepository,
            getUserBasicInfo,
        });
        jest.clearAllMocks();
        conversationRepository.findById.mockResolvedValue(mockConversation);
    });

    describe('participation check', () => {
        it('should throw notFoundException when conversation does not exist', async () => {
            conversationRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute('missing_conv', requestUserId)).rejects.toMatchObject({
                name: 'NotFoundException',
                statusCode: 404,
            });
            expect(messageRepository.findByConversationId).not.toHaveBeenCalled();
        });

        it('should throw forbiddenException when user is not a participant', async () => {
            await expect(useCase.execute('conv_123', 'intruder_user')).rejects.toMatchObject({
                name: 'ForbiddenException',
                statusCode: 403,
            });
            expect(messageRepository.findByConversationId).not.toHaveBeenCalled();
        });

        it('should treat participant ids as strings when comparing', async () => {
            conversationRepository.findById.mockResolvedValue({
                id: 'conv_123',
                participants: [{ toString: () => 'user_123' }, 'user_456'],
            });
            messageRepository.findByConversationId.mockResolvedValue({
                messages: [],
                total: 0,
                hasMore: false,
            });

            const result = await useCase.execute('conv_123', requestUserId);

            expect(result.messages).toEqual([]);
        });
    });

    describe('execute', () => {
        it('should return formatted messages for a conversation', async () => {
            const conversationId = 'conv_123';
            const mockMessages = [
                { id: 'msg_1', content: 'Hello', senderId: 'user_123', receiverId: 'user_456' },
                { id: 'msg_2', content: 'Hi', senderId: 'user_456', receiverId: 'user_123' },
            ];
            const mockResult = {
                messages: mockMessages,
                total: 2,
                hasMore: false,
            };

            messageRepository.findByConversationId.mockResolvedValue(mockResult);
            getUserBasicInfo.mockResolvedValue({ id: 'user_123', name: 'Test User' });

            const result = await useCase.execute(conversationId, requestUserId);

            expect(messageRepository.findByConversationId).toHaveBeenCalledWith(conversationId, {});
            expect(messageResponseDTO).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                messages: [
                    {
                        id: 'msg_1',
                        content: 'Hello',
                        senderId: 'user_123',
                        receiverId: 'user_456',
                        formatted: true,
                    },
                    {
                        id: 'msg_2',
                        content: 'Hi',
                        senderId: 'user_456',
                        receiverId: 'user_123',
                        formatted: true,
                    },
                ],
                total: 2,
                hasMore: false,
            });
            expect(log.debug).toHaveBeenCalledWith(
                'Fetching conversation messages',
                expect.any(Object),
            );
            expect(log.info).toHaveBeenCalledWith(
                'Conversation messages retrieved successfully',
                expect.any(Object),
            );
        });

        it('should pass options to the repository', async () => {
            const conversationId = 'conv_123';
            const options = { limit: 20, skip: 10 };
            const mockResult = {
                messages: [],
                total: 0,
                hasMore: false,
            };

            messageRepository.findByConversationId.mockResolvedValue(mockResult);

            await useCase.execute(conversationId, requestUserId, options);

            expect(messageRepository.findByConversationId).toHaveBeenCalledWith(
                conversationId,
                options,
            );
            expect(log.debug).toHaveBeenCalledWith('Fetching conversation messages', {
                conversationId,
                userId: requestUserId,
                options,
            });
        });

        it('should handle empty messages array', async () => {
            const conversationId = 'conv_123';
            const mockResult = {
                messages: [],
                total: 0,
                hasMore: false,
            };

            messageRepository.findByConversationId.mockResolvedValue(mockResult);

            const result = await useCase.execute(conversationId, requestUserId);

            expect(result).toEqual({
                messages: [],
                total: 0,
                hasMore: false,
            });
            expect(messageResponseDTO).not.toHaveBeenCalled();
        });

        it('should handle user not found gracefully', async () => {
            const conversationId = 'conv_123';
            const mockMessages = [
                { id: 'msg_1', content: 'Hello', senderId: 'user_123', receiverId: 'user_456' },
            ];
            const mockResult = {
                messages: mockMessages,
                total: 1,
                hasMore: false,
            };

            messageRepository.findByConversationId.mockResolvedValue(mockResult);
            getUserBasicInfo.mockRejectedValue(new Error('User not found'));

            const result = await useCase.execute(conversationId, requestUserId);

            expect(log.warn).toHaveBeenCalledWith('User not found in database', expect.any(Object));
            expect(result.messages).toHaveLength(1);
        });

        it('should throw an error if repository fails', async () => {
            const conversationId = 'conv_123';
            const error = new Error('Database error');

            messageRepository.findByConversationId.mockRejectedValue(error);

            await expect(useCase.execute(conversationId, requestUserId)).rejects.toThrow(
                'Database error',
            );
            expect(log.error).toHaveBeenCalledWith(
                'Error fetching conversation messages',
                expect.any(Object),
            );
        });
    });
});
