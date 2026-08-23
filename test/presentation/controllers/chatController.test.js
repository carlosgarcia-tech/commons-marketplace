import {
    sendMessage,
    getConversationMessages,
    getUserConversations,
    markMessagesAsRead,
    generateChatToken,
    getConversationByParticipant,
} from '../../../src/presentation/controllers/chatController.js';
import { badRequestException } from '../../../src/presentation/exceptions/index.js';

describe('Message Controller', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'user_123' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    describe('sendMessage', () => {
        let sendMessageUseCase;
        let controller;

        beforeEach(() => {
            sendMessageUseCase = {
                execute: jest.fn(),
            };
            controller = sendMessage({ sendMessageUseCase });
        });

        it('should send a message successfully', async () => {
            req.body = {
                receiverId: 'user_456',
                content: 'Hello World',
                type: 'text',
                metadata: {},
            };
            const mockMessage = {
                id: 'msg_123',
                senderId: 'user_123',
                receiverId: 'user_456',
                content: 'Hello World',
            };

            sendMessageUseCase.execute.mockResolvedValue(mockMessage);

            await controller(req, res, next);

            expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
                senderId: 'user_123',
                receiverId: 'user_456',
                content: 'Hello World',
                type: 'text',
                metadata: {},
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMessage,
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should throw error when receiverId is missing', async () => {
            req.body = {
                content: 'Hello World',
            };

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(
                badRequestException('Receiver ID and content are required'),
            );
            expect(sendMessageUseCase.execute).not.toHaveBeenCalled();
        });

        it('should throw error when content is missing', async () => {
            req.body = {
                receiverId: 'user_456',
            };

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(
                badRequestException('Receiver ID and content are required'),
            );
            expect(sendMessageUseCase.execute).not.toHaveBeenCalled();
        });

        it('should handle use case errors', async () => {
            req.body = {
                receiverId: 'user_456',
                content: 'Hello',
            };
            const error = new Error('Use case error');

            sendMessageUseCase.execute.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should send message with minimal fields', async () => {
            req.body = {
                receiverId: 'user_456',
                content: 'Hello',
            };
            const mockMessage = { id: 'msg_123' };

            sendMessageUseCase.execute.mockResolvedValue(mockMessage);

            await controller(req, res, next);

            expect(sendMessageUseCase.execute).toHaveBeenCalledWith({
                senderId: 'user_123',
                receiverId: 'user_456',
                content: 'Hello',
                type: undefined,
                metadata: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getConversationMessages', () => {
        let getConversationMessagesUseCase;
        let controller;

        beforeEach(() => {
            getConversationMessagesUseCase = {
                execute: jest.fn(),
            };
            controller = getConversationMessages({ getConversationMessagesUseCase });
        });

        it('should get conversation messages with default pagination', async () => {
            req.params = { conversationId: 'conv_123' };
            const mockResult = {
                messages: [{ id: 'msg_1' }, { id: 'msg_2' }],
                total: 2,
                hasMore: false,
            };

            getConversationMessagesUseCase.execute.mockResolvedValue(mockResult);

            await controller(req, res, next);

            expect(getConversationMessagesUseCase.execute).toHaveBeenCalledWith(
                'conv_123',
                'user_123',
                {
                    limit: 50,
                    skip: 0,
                },
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult,
            });
        });

        it('should get conversation messages with custom pagination', async () => {
            req.params = { conversationId: 'conv_123' };
            req.query = { limit: '20', skip: '10' };
            const mockResult = { messages: [], total: 0, hasMore: false };

            getConversationMessagesUseCase.execute.mockResolvedValue(mockResult);

            await controller(req, res, next);

            expect(getConversationMessagesUseCase.execute).toHaveBeenCalledWith(
                'conv_123',
                'user_123',
                {
                    limit: 20,
                    skip: 10,
                },
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle use case errors', async () => {
            req.params = { conversationId: 'conv_123' };
            const error = new Error('Database error');

            getConversationMessagesUseCase.execute.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getUserConversations', () => {
        let getUserConversationsUseCase;
        let controller;

        beforeEach(() => {
            getUserConversationsUseCase = {
                execute: jest.fn(),
            };
            controller = getUserConversations({ getUserConversationsUseCase });
        });

        it('should get user conversations with default pagination', async () => {
            const mockResult = {
                conversations: [{ id: 'conv_1' }, { id: 'conv_2' }],
                total: 2,
                hasMore: false,
            };

            getUserConversationsUseCase.execute.mockResolvedValue(mockResult);

            await controller(req, res, next);

            expect(getUserConversationsUseCase.execute).toHaveBeenCalledWith('user_123', {
                limit: 20,
                skip: 0,
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult,
            });
        });

        it('should get user conversations with custom pagination', async () => {
            req.query = { limit: '50', skip: '25' };
            const mockResult = { conversations: [], total: 0, hasMore: false };

            getUserConversationsUseCase.execute.mockResolvedValue(mockResult);

            await controller(req, res, next);

            expect(getUserConversationsUseCase.execute).toHaveBeenCalledWith('user_123', {
                limit: 50,
                skip: 25,
            });
        });

        it('should handle use case errors', async () => {
            const error = new Error('Database error');

            getUserConversationsUseCase.execute.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('markMessagesAsRead', () => {
        let markMessagesAsReadUseCase;
        let controller;

        beforeEach(() => {
            markMessagesAsReadUseCase = {
                execute: jest.fn(),
            };
            controller = markMessagesAsRead({ markMessagesAsReadUseCase });
        });

        it('should mark messages as read successfully', async () => {
            req.params = { conversationId: 'conv_123' };
            const mockResult = {
                success: true,
                updatedCount: 5,
            };

            markMessagesAsReadUseCase.execute.mockResolvedValue(mockResult);

            await controller(req, res, next);

            expect(markMessagesAsReadUseCase.execute).toHaveBeenCalledWith('conv_123', 'user_123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult,
            });
        });

        it('should handle use case errors', async () => {
            req.params = { conversationId: 'conv_123' };
            const error = new Error('Update failed');

            markMessagesAsReadUseCase.execute.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('generateChatToken', () => {
        let generateChatTokenUseCase;
        let controller;

        beforeEach(() => {
            generateChatTokenUseCase = {
                execute: jest.fn(),
            };
            controller = generateChatToken({ generateChatTokenUseCase });
        });

        it('should generate chat token successfully', async () => {
            const mockToken = {
                token: 'token_abc123',
                expiresAt: new Date().toISOString(),
            };

            generateChatTokenUseCase.execute.mockResolvedValue(mockToken);

            await controller(req, res, next);

            expect(generateChatTokenUseCase.execute).toHaveBeenCalledWith('user_123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockToken,
            });
        });

        it('should handle use case errors', async () => {
            const error = new Error('Token generation failed');

            generateChatTokenUseCase.execute.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getConversationByParticipant', () => {
        let conversationRepository;
        let controller;

        beforeEach(() => {
            conversationRepository = {
                findByParticipants: jest.fn(),
                create: jest.fn(),
            };
            controller = getConversationByParticipant({ conversationRepository });
        });

        it('should return existing conversation', async () => {
            req.params = { participantId: 'user_456' };
            const mockConversation = {
                id: 'conv_123',
                participants: ['user_123', 'user_456'],
            };

            conversationRepository.findByParticipants.mockResolvedValue(mockConversation);

            await controller(req, res, next);

            expect(conversationRepository.findByParticipants).toHaveBeenCalledWith(
                'user_123',
                'user_456',
            );
            expect(conversationRepository.create).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockConversation,
            });
        });

        it('should create new conversation if none exists', async () => {
            req.params = { participantId: 'user_456' };
            const mockConversation = {
                id: 'conv_new',
                participants: ['user_123', 'user_456'],
            };

            conversationRepository.findByParticipants.mockResolvedValue(null);
            conversationRepository.create.mockResolvedValue(mockConversation);

            await controller(req, res, next);

            expect(conversationRepository.findByParticipants).toHaveBeenCalledWith(
                'user_123',
                'user_456',
            );
            expect(conversationRepository.create).toHaveBeenCalledWith({
                participants: ['user_123', 'user_456'],
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockConversation,
            });
        });

        it('should throw error when trying to create conversation with self', async () => {
            req.params = { participantId: 'user_123' };

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(
                badRequestException('Cannot create conversation with yourself'),
            );
            expect(conversationRepository.findByParticipants).not.toHaveBeenCalled();
            expect(conversationRepository.create).not.toHaveBeenCalled();
        });

        it('should handle repository errors', async () => {
            req.params = { participantId: 'user_456' };
            const error = new Error('Database error');

            conversationRepository.findByParticipants.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('should handle conversation creation errors', async () => {
            req.params = { participantId: 'user_456' };
            const error = new Error('Creation failed');

            conversationRepository.findByParticipants.mockResolvedValue(null);
            conversationRepository.create.mockRejectedValue(error);

            await controller(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
