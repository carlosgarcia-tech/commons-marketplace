import { conversationResponseDTO } from '../../../../src/application/dtos/conversations/ConversationResponseDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('ConversationResponseDTO', () => {
    const baseConversation = {
        id: 'conv123',
        participants: ['user1', 'user2'],
        lastMessage: 'Hello!',
        lastMessageAt: new Date(),
        unreadCount: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const participantsData = {
        user1: {
            name: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            profilePicUrl: 'pic.jpg',
            isApprovedSeller: true,
        },
        user2: { name: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
    };

    it('should format conversation with id', () => {
        const result = conversationResponseDTO(baseConversation, 'user1', participantsData);
        expect(result.id).toBe('conv123');
    });

    it('should enrich participants with data', () => {
        const result = conversationResponseDTO(baseConversation, 'user1', participantsData);
        expect(result.participants).toHaveLength(2);
        expect(result.participants[0]).toHaveProperty('name');
    });

    it('should handle missing participants data', () => {
        const result = conversationResponseDTO(baseConversation, 'user1', {});
        expect(result.participants[0].id).toBe('user1');
    });

    it('should calculate unread count from Map-like object', () => {
        const conv = {
            ...baseConversation,
            unreadCount: new Map([['user1', 3]]),
            get: function (key) {
                return this.get(key);
            },
        };
        const result = conversationResponseDTO(conv, 'user1', {});
        expect(result.unreadCount).toBe(3);
    });

    it('should calculate unread count from plain object', () => {
        const conv = { ...baseConversation, unreadCount: { user1: 5 } };
        const result = conversationResponseDTO(conv, 'user1', {});
        expect(result.unreadCount).toBe(5);
    });

    it('should default unread count to 0', () => {
        const result = conversationResponseDTO(baseConversation, 'user1', {});
        expect(result.unreadCount).toBe(0);
    });

    it('should include lastMessage', () => {
        const result = conversationResponseDTO(baseConversation, 'user1', {});
        expect(result.lastMessage).toBe('Hello!');
    });

    it('should handle _id as alternative to id', () => {
        const conv = { ...baseConversation, _id: 'conv456' };
        delete conv.id;
        const result = conversationResponseDTO(conv, 'user1', {});
        expect(result.id).toBe('conv456');
    });
});
