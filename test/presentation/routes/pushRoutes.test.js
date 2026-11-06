import { createPushRoutes } from '../../../src/presentation/routes/pushRoutes.js';
import PushNotificationService from '../../../src/infrastructure/services/pushNotificationService.js';

describe('PushRoutes', () => {
    let router;

    beforeEach(() => {
        router = createPushRoutes();
        jest.clearAllMocks();
        jest.spyOn(PushNotificationService, 'subscribe');
        jest.spyOn(PushNotificationService, 'unsubscribe');
        jest.spyOn(PushNotificationService, 'getPublicKey').mockReturnValue('test-public-key');
    });

    describe('POST /subscribe', () => {
        it('should subscribe user with valid data', () => {
            const mockReq = {
                user: { id: 'user123' },
                body: { endpoint: 'test-endpoint' },
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[0].route.stack[0].handle;
            handler(mockReq, mockRes, mockNext);

            expect(PushNotificationService.subscribe).toHaveBeenCalledWith('user123', mockReq.body);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return 400 if user ID or subscription missing', () => {
            const mockReq = {
                user: null,
                body: null,
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[0].route.stack[0].handle;
            handler(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing user ID or subscription' });
        });
    });

    describe('DELETE /unsubscribe', () => {
        it('should unsubscribe user', () => {
            const mockReq = {
                user: { id: 'user123' },
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[1].route.stack[0].handle;
            handler(mockReq, mockRes, mockNext);

            expect(PushNotificationService.unsubscribe).toHaveBeenCalledWith('user123');
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return 401 if user not authenticated', () => {
            const mockReq = {
                user: null,
            };
            const mockRes = {
                json: jest.fn().mockReturnThis(),
                status: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[1].route.stack[0].handle;
            handler(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        });
    });

    describe('GET /public-key', () => {
        it('should return public key', () => {
            const mockReq = {};
            const mockRes = {
                json: jest.fn().mockReturnThis(),
            };
            const mockNext = jest.fn();

            const handler = router.stack[2].route.stack[0].handle;
            handler(mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({ publicKey: 'test-public-key' });
        });
    });
});
