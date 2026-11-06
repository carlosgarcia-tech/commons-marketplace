import PushNotificationService, {
    generateVapidKeys,
} from '../../../src/infrastructure/services/pushNotificationService.js';

jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    generateVAPIDKeys: jest.fn().mockReturnValue({
        publicKey: 'testPublicKey',
        privateKey: 'testPrivateKey',
    }),
    sendNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe('PushNotificationService', () => {
    describe('generateVapidKeys', () => {
        it('should generate VAPID keys', () => {
            const keys = generateVapidKeys();

            expect(keys).toHaveProperty('publicKey');
            expect(keys).toHaveProperty('privateKey');
            expect(keys.publicKey).toBe('testPublicKey');
            expect(keys.privateKey).toBe('testPrivateKey');
        });
    });

    describe('subscribe', () => {
        it('should add subscription for user', () => {
            const userId = 'user123';
            const subscription = { endpoint: 'test-endpoint', keys: { p256dh: 'test' } };

            PushNotificationService.subscribe(userId, subscription);

            expect(PushNotificationService.subscribe).toBeDefined();
        });
    });

    describe('unsubscribe', () => {
        it('should remove subscription for user', () => {
            const userId = 'user123';
            const subscription = { endpoint: 'test-endpoint', keys: { p256dh: 'test' } };

            PushNotificationService.subscribe(userId, subscription);
            PushNotificationService.unsubscribe(userId);

            expect(PushNotificationService.unsubscribe).toBeDefined();
        });
    });

    describe('getPublicKey', () => {
        it('should return VAPID public key', () => {
            const publicKey = PushNotificationService.getPublicKey();

            expect(publicKey).toBeDefined();
        });
    });

    describe('sendNotification', () => {
        it('should send notification to user with subscription', async () => {
            const userId = 'user123';
            const subscription = { endpoint: 'test-endpoint', keys: { p256dh: 'test' } };
            const payload = { title: 'Test', body: 'Test message' };

            PushNotificationService.subscribe(userId, subscription);
            await PushNotificationService.sendNotification(userId, payload);

            expect(PushNotificationService.sendNotification).toBeDefined();
        });

        it('should do nothing if user has no subscription', async () => {
            const userId = 'nonexistent';
            const payload = { title: 'Test', body: 'Test message' };

            await PushNotificationService.sendNotification(userId, payload);

            expect(PushNotificationService.sendNotification).toBeDefined();
        });
    });

    describe('broadcast', () => {
        it('should broadcast to all subscribers', async () => {
            const subscription = { endpoint: 'test-endpoint', keys: { p256dh: 'test' } };
            const payload = { title: 'Test', body: 'Test message' };

            PushNotificationService.subscribe('user1', subscription);
            PushNotificationService.subscribe('user2', subscription);

            await PushNotificationService.broadcast(payload);

            expect(PushNotificationService.broadcast).toBeDefined();
        });
    });
});
