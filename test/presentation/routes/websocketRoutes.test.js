import { createWebSocketRoutes } from '../../../src/presentation/routes/websocketRoutes.js';

describe('WebSocketRoutes', () => {
    let router;
    const mockGenerateChatTokenUseCase = jest.fn().mockResolvedValue('test-token');

    beforeEach(() => {
        router = createWebSocketRoutes(mockGenerateChatTokenUseCase);
        jest.clearAllMocks();
    });

    describe('GET /token', () => {
        it('should return token for authenticated user', async () => {
            const mockReq = {
                user: { id: 'user123' },
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[0].route.stack[0].handle;
            await handler(mockReq, mockRes, mockNext);

            expect(mockGenerateChatTokenUseCase).toHaveBeenCalledWith('user123');
            expect(mockRes.json).toHaveBeenCalledWith({
                token: 'test-token',
                socketUrl: expect.any(String),
            });
        });

        it('should return 401 if user not authenticated', async () => {
            const mockReq = {
                user: null,
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[0].route.stack[0].handle;
            await handler(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });

        it('should call next with error if use case fails', async () => {
            mockGenerateChatTokenUseCase.mockRejectedValue(new Error('Error'));
            const mockReq = {
                user: { id: 'user123' },
            };
            const mockRes = {};
            const mockNext = jest.fn();

            const handler = router.stack[0].route.stack[0].handle;
            await handler(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
