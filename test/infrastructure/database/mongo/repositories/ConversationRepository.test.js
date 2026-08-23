import {
    create,
    findByParticipants,
    incrementUnreadCount,
    resetUnreadCount,
} from '../../../../../src/infrastructure/database/mongo/repositories/ConversationRepository.js';
import ConversationModel from '../../../../../src/infrastructure/database/mongo/models/ConversationModel.js';

jest.mock('../../../../../src/infrastructure/database/mongo/models/ConversationModel.js', () => ({
    __esModule: true,
    default: {
        create: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
    },
}));

const mockChain = (resolvedValue) => {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(resolvedValue),
    };
    return chain;
};

describe('ConversationRepository', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a conversation and map it through the entity', async () => {
            const saved = {
                toObject: () => ({ id: 'conv1', participants: ['a', 'b'] }),
            };
            ConversationModel.create.mockResolvedValue(saved);

            const result = await create({ participants: ['a', 'b'] });

            expect(ConversationModel.create).toHaveBeenCalledWith({ participants: ['a', 'b'] });
            expect(result).toMatchObject({ id: 'conv1' });
        });

        it('should return the existing conversation when a concurrent creation wins the unique index race', async () => {
            const duplicateError = Object.assign(new Error('E11000 duplicate key'), {
                code: 11000,
            });
            ConversationModel.create.mockRejectedValue(duplicateError);

            const existing = { id: 'conv-existing', participants: ['b', 'a'] };
            ConversationModel.findOne.mockReturnValue(mockChain(existing));

            const result = await create({ participants: ['a', 'b'] });

            expect(ConversationModel.create).toHaveBeenCalled();
            expect(ConversationModel.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    participants: { $all: ['a', 'b'] },
                }),
            );
            expect(result).toMatchObject({ id: 'conv-existing' });
        });

        it('should rethrow non-duplicate-key errors', async () => {
            const error = new Error('connection failure');
            ConversationModel.create.mockRejectedValue(error);

            await expect(create({ participants: ['a', 'b'] })).rejects.toThrow(
                'connection failure',
            );
        });
    });

    describe('findByParticipants', () => {
        it('should query with $all on both participants', async () => {
            ConversationModel.findOne.mockReturnValue(mockChain(null));

            const result = await findByParticipants('user1', 'user2');

            expect(ConversationModel.findOne).toHaveBeenCalledWith({
                participants: { $all: ['user1', 'user2'] },
            });
            expect(result).toBeNull();
        });
    });

    describe('incrementUnreadCount', () => {
        it('should use an atomic $inc update', async () => {
            const updated = { id: 'conv1', unreadCount: { user1: 3 } };
            ConversationModel.findOneAndUpdate.mockReturnValue(mockChain(updated));

            const result = await incrementUnreadCount('conv1', 'user1');

            expect(ConversationModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'conv1' },
                { $inc: { 'unreadCount.user1': 1 } },
                { new: true },
            );
            expect(result).toMatchObject({ id: 'conv1' });
        });

        it('should return null when the conversation does not exist', async () => {
            ConversationModel.findOneAndUpdate.mockReturnValue(mockChain(null));

            const result = await incrementUnreadCount('missing', 'user1');

            expect(result).toBeNull();
        });
    });

    describe('resetUnreadCount', () => {
        it('should atomically set the counter to zero', async () => {
            const updated = { id: 'conv1', unreadCount: { user1: 0 } };
            ConversationModel.findOneAndUpdate.mockReturnValue(mockChain(updated));

            const result = await resetUnreadCount('conv1', 'user1');

            expect(ConversationModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: 'conv1' },
                { $set: { 'unreadCount.user1': 0 } },
                { new: true },
            );
            expect(result).toMatchObject({ id: 'conv1' });
        });

        it('should return null when the conversation does not exist', async () => {
            ConversationModel.findOneAndUpdate.mockReturnValue(mockChain(null));

            const result = await resetUnreadCount('missing', 'user1');

            expect(result).toBeNull();
        });
    });
});
