import { messageResponseDTO } from '../../../../src/application/dtos/messages/MessageResponseDTO.js';

jest.mock('../../../../src/infrastructure/logger/logger.js', () => ({
    log: { info: jest.fn(), debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

describe('MessageResponseDTO', () => {
    const baseMessage = {
        id: 'msg123',
        conversationId: 'conv123',
        senderId: 'sender1',
        receiverId: 'receiver1',
        content: 'Hello!',
        type: 'text',
        status: 'sent',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const senderData = {
        name: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        profilePicUrl: 'pic.jpg',
        isApprovedSeller: true,
    };
    const receiverData = { name: 'Jane', lastName: 'Smith', email: 'jane@test.com' };

    it('should format message with id', () => {
        const result = messageResponseDTO(baseMessage);
        expect(result.id).toBe('msg123');
    });

    it('should format with _id as alternative', () => {
        const msg = { ...baseMessage, _id: 'msg456' };
        delete msg.id;
        const result = messageResponseDTO(msg);
        expect(result.id).toBe('msg456');
    });

    it('should include sender info', () => {
        const result = messageResponseDTO(baseMessage, senderData);
        expect(result.sender).toHaveProperty('id');
        expect(result.sender).toHaveProperty('name');
    });

    it('should include receiver info when provided', () => {
        const result = messageResponseDTO(baseMessage, senderData, receiverData);
        expect(result.receiver).toHaveProperty('id');
        expect(result.receiver).toHaveProperty('name');
    });

    it('should handle null senderData', () => {
        const result = messageResponseDTO(baseMessage, null, null);
        expect(result.sender.name).toBeUndefined();
        expect(result.sender.id).toBe('sender1');
    });

    it('should include content and type', () => {
        const result = messageResponseDTO(baseMessage);
        expect(result.content).toBe('Hello!');
        expect(result.type).toBe('text');
    });

    it('should include status', () => {
        const result = messageResponseDTO(baseMessage);
        expect(result.status).toBe('sent');
    });

    it('should include metadata', () => {
        const result = messageResponseDTO(baseMessage);
        expect(result.metadata).toEqual({});
    });

    it('should include timestamps', () => {
        const result = messageResponseDTO(baseMessage);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
    });
});
