import express from 'express';

export const createWebSocketRoutes = (generateChatTokenUseCase) => {
    const router = express.Router();

    router.get('/token', async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const token = await generateChatTokenUseCase(userId);

            res.json({
                token,
                socketUrl: process.env.SOCKET_URL || 'http://localhost:3000',
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
