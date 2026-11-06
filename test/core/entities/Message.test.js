import { createMessage } from '../../../src/core/entities/Message.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Message Entity', () => {
    describe('createMessage', () => {
        it('should create a message with all provided fields', () => {
            const message = createMessage({
                id: 'msg123',
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
                type: 'text',
                status: 'delivered',
                metadata: { key: 'value' },
            });
            expect(message.id).toBe('msg123');
            expect(message.conversationId).toBe('conv123');
            expect(message.senderId).toBe('user1');
            expect(message.receiverId).toBe('user2');
            expect(message.content).toBe('Hello!');
            expect(message.type).toBe('text');
            expect(message.status).toBe('delivered');
            expect(message.metadata).toEqual({ key: 'value' });
        });

        it('should handle missing optional fields', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.id).toBeUndefined();
            expect(message.type).toBe('text');
            expect(message.status).toBe('sent');
            expect(message.metadata).toEqual({});
        });

        it('should use _id as fallback for id', () => {
            const message = createMessage({
                _id: 'msg123',
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.id).toBe('msg123');
            expect(message._id).toBe('msg123');
        });

        it('should set default type to text', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.type).toBe('text');
        });

        it('should set default status to sent', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.status).toBe('sent');
        });

        it('should set default metadata to empty object', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.metadata).toEqual({});
        });

        it('should set createdAt and updatedAt when not provided', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
            });
            expect(message.createdAt).toBeInstanceOf(Date);
            expect(message.updatedAt).toBeInstanceOf(Date);
        });

        it('should preserve provided timestamps', () => {
            const createdAt = new Date('2024-01-01');
            const updatedAt = new Date('2024-01-02');
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
                createdAt,
                updatedAt,
            });
            expect(message.createdAt).toBe(createdAt);
            expect(message.updatedAt).toBe(updatedAt);
        });

        it('should handle different message types', () => {
            expect(
                createMessage({
                    conversationId: 'c1',
                    senderId: 'u1',
                    receiverId: 'u2',
                    content: 'Hi',
                    type: 'image',
                }).type,
            ).toBe('image');
            expect(
                createMessage({
                    conversationId: 'c1',
                    senderId: 'u1',
                    receiverId: 'u2',
                    content: 'Hi',
                    type: 'file',
                }).type,
            ).toBe('file');
        });

        it('should handle different statuses', () => {
            expect(
                createMessage({
                    conversationId: 'c1',
                    senderId: 'u1',
                    receiverId: 'u2',
                    content: 'Hi',
                    status: 'sent',
                }).status,
            ).toBe('sent');
            expect(
                createMessage({
                    conversationId: 'c1',
                    senderId: 'u1',
                    receiverId: 'u2',
                    content: 'Hi',
                    status: 'delivered',
                }).status,
            ).toBe('delivered');
            expect(
                createMessage({
                    conversationId: 'c1',
                    senderId: 'u1',
                    receiverId: 'u2',
                    content: 'Hi',
                    status: 'read',
                }).status,
            ).toBe('read');
        });

        it('should handle complex metadata', () => {
            const message = createMessage({
                conversationId: 'conv123',
                senderId: 'user1',
                receiverId: 'user2',
                content: 'Hello!',
                metadata: { attachment: { name: 'file.pdf', size: 1024 } },
            });
            expect(message.metadata.attachment.name).toBe('file.pdf');
        });

        it('should handle null conversationId', () => {
            const message = createMessage({
                conversationId: null,
                senderId: 'u1',
                receiverId: 'u2',
                content: 'Hi',
            });
            expect(message.conversationId).toBeNull();
        });

        it('should use default status when not provided', () => {
            const message = createMessage({
                conversationId: 'c1',
                senderId: 'u1',
                receiverId: 'u2',
                content: 'Hi',
            });
            expect(message.status).toBe('sent');
        });
    });
});
