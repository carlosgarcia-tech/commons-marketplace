import { createMessageDTO } from '../../../../src/application/dtos/messages/CreateMessageDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('CreateMessageDTO', () => {
    it('should create DTO with required fields', () => {
        const data = {
            conversationId: 'conv123',
            senderId: 'sender1',
            receiverId: 'receiver1',
            content: 'Hello',
        };
        const result = createMessageDTO(data);

        expect(result.conversationId).toBe('conv123');
        expect(result.senderId).toBe('sender1');
        expect(result.receiverId).toBe('receiver1');
        expect(result.content).toBe('Hello');
    });

    it('should default type to text', () => {
        const result = createMessageDTO({
            conversationId: 'conv1',
            senderId: 's1',
            receiverId: 'r1',
            content: 'Hi',
        });
        expect(result.type).toBe('text');
    });

    it('should use custom type when provided', () => {
        const result = createMessageDTO({
            conversationId: 'conv1',
            senderId: 's1',
            receiverId: 'r1',
            content: 'Image',
            type: 'image',
        });
        expect(result.type).toBe('image');
    });

    it('should default metadata to empty object', () => {
        const result = createMessageDTO({
            conversationId: 'conv1',
            senderId: 's1',
            receiverId: 'r1',
            content: 'Hi',
        });
        expect(result.metadata).toEqual({});
    });

    it('should use custom metadata when provided', () => {
        const result = createMessageDTO({
            conversationId: 'conv1',
            senderId: 's1',
            receiverId: 'r1',
            content: 'Hi',
            metadata: { attachment: 'file.pdf' },
        });
        expect(result.metadata).toEqual({ attachment: 'file.pdf' });
    });

    it('should handle all fields', () => {
        const data = {
            conversationId: 'conv123',
            senderId: 'sender1',
            receiverId: 'receiver1',
            content: 'Test message',
            type: 'file',
            metadata: { size: 1024 },
        };
        const result = createMessageDTO(data);
        expect(result).toEqual(data);
    });
});
