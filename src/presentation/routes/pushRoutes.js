import express from 'express';
import PushNotificationService from '../../infrastructure/services/pushNotificationService.js';

export const createPushRoutes = () => {
    const router = express.Router();

    router.post('/subscribe', async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const subscription = req.body;

            if (!userId || !subscription) {
                return res.status(400).json({ error: 'Missing user ID or subscription' });
            }

            PushNotificationService.subscribe(userId, subscription);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    });

    router.delete('/unsubscribe', async (req, res, next) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            PushNotificationService.unsubscribe(userId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    });

    router.get('/public-key', (req, res) => {
        res.json({
            publicKey: PushNotificationService.getPublicKey(),
        });
    });

    return router;
};
