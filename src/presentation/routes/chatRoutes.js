import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { chatLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validationMiddleware.js';
import {
    validateSendMessage,
    validateGetConversationMessages,
    validateMarkMessagesAsRead,
    validateGetConversationByParticipant,
    validateGetUserConversations,
} from '../validators/chatValidator.js';

/**
 * Factory function to create and configure the router for chat-related endpoints.
 * @description Creates Express router with all chat routes and authentication
 * @param {object} chatController - The controller containing the handler methods for chat
 * @returns {express.Router} An Express router instance with all chat routes defined
 */
export const createChatRoutes = (chatController) => {
    const router = express.Router();

    router.get('/token', authenticate, (req, res, next) =>
        chatController.generateChatToken(req, res, next),
    );

    router.post(
        '/messages',
        authenticate,
        chatLimiter,
        validateSendMessage,
        validate,
        (req, res, next) => chatController.sendMessage(req, res, next),
    );

    router.get(
        '/conversations',
        authenticate,
        validateGetUserConversations,
        validate,
        (req, res, next) => chatController.getUserConversations(req, res, next),
    );

    router.get(
        '/conversations/user/:participantId',
        authenticate,
        validateGetConversationByParticipant,
        validate,
        (req, res, next) => chatController.getConversationByParticipant(req, res, next),
    );

    router.get(
        '/conversations/:conversationId/messages',
        authenticate,
        validateGetConversationMessages,
        validate,
        (req, res, next) => chatController.getConversationMessages(req, res, next),
    );

    router.put(
        '/conversations/:conversationId/read',
        authenticate,
        validateMarkMessagesAsRead,
        validate,
        (req, res, next) => chatController.markMessagesAsRead(req, res, next),
    );

    return router;
};
