import { createConversation } from '../../../src/core/entities/Conversation.js';

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('Conversation Entity', () => {
    describe('createConversation', () => {
        it('should create a conversation with all provided fields', () => {
            const conversation = createConversation({
                id: 'conv123',
                participants: ['user1', 'user2'],
                lastMessage: 'Hello!',
                lastMessageAt: new Date(),
                unreadCount: { user1: 2, user2: 0 },
                metadata: { key: 'value' },
            });
            expect(conversation.id).toBe('conv123');
            expect(conversation.participants).toEqual(['user1', 'user2']);
            expect(conversation.lastMessage).toBe('Hello!');
            expect(conversation.lastMessageAt).toBeInstanceOf(Date);
            expect(conversation.unreadCount).toEqual({ user1: 2, user2: 0 });
            expect(conversation.metadata).toEqual({ key: 'value' });
        });

        it('should handle missing optional fields', () => {
            const conversation = createConversation({});
            expect(conversation.id).toBeUndefined();
            expect(conversation._id).toBeUndefined();
            expect(conversation.participants).toEqual([]);
            expect(conversation.lastMessage).toBeNull();
            expect(conversation.lastMessageAt).toBeNull();
            expect(conversation.unreadCount).toEqual({});
            expect(conversation.metadata).toEqual({});
        });

        it('should set default participants to empty array', () => {
            const conversation = createConversation({});
            expect(conversation.participants).toEqual([]);
        });

        it('should set default lastMessage to null', () => {
            const conversation = createConversation({});
            expect(conversation.lastMessage).toBeNull();
        });

        it('should set default lastMessageAt to null', () => {
            const conversation = createConversation({});
            expect(conversation.lastMessageAt).toBeNull();
        });

        it('should set default unreadCount to empty object', () => {
            const conversation = createConversation({});
            expect(conversation.unreadCount).toEqual({});
        });

        it('should set default metadata to empty object', () => {
            const conversation = createConversation({});
            expect(conversation.metadata).toEqual({});
        });

        it('should set createdAt and updatedAt when not provided', () => {
            const conversation = createConversation({});
            expect(conversation.createdAt).toBeInstanceOf(Date);
            expect(conversation.updatedAt).toBeInstanceOf(Date);
        });

        it('should preserve provided timestamps', () => {
            const createdAt = new Date('2024-01-01');
            const updatedAt = new Date('2024-01-02');
            const conversation = createConversation({
                createdAt,
                updatedAt,
            });
            expect(conversation.createdAt).toBe(createdAt);
            expect(conversation.updatedAt).toBe(updatedAt);
        });

        it('should handle _id as alternative to id', () => {
            const conversation = createConversation({
                _id: 'conv123',
            });
            expect(conversation.id).toBe('conv123');
            expect(conversation._id).toBe('conv123');
        });

        it('should handle single participant', () => {
            const conversation = createConversation({
                participants: ['user1'],
            });
            expect(conversation.participants).toEqual(['user1']);
        });

        it('should handle multiple participants', () => {
            const conversation = createConversation({
                participants: ['user1', 'user2', 'user3', 'user4'],
            });
            expect(conversation.participants).toHaveLength(4);
        });

        it('should handle complex unreadCount', () => {
            const conversation = createConversation({
                unreadCount: { user1: 5, user2: 0, user3: 10 },
            });
            expect(conversation.unreadCount.user1).toBe(5);
        });

        it('should handle complex metadata', () => {
            const conversation = createConversation({
                metadata: { pinned: true, folder: 'important' },
            });
            expect(conversation.metadata.pinned).toBe(true);
        });

        it('should use default for null participants', () => {
            const conversation = createConversation({
                participants: null,
            });
            expect(conversation.participants).toEqual([]);
        });

        it('should use default lastMessage for null', () => {
            const conversation = createConversation({
                lastMessage: null,
            });
            expect(conversation.lastMessage).toBeNull();
        });

        it('should handle empty arrays and objects', () => {
            const conversation = createConversation({
                participants: [],
                metadata: {},
            });
            expect(conversation.participants).toEqual([]);
            expect(conversation.metadata).toEqual({});
        });
    });
});
