import webpush from 'web-push';
import { log } from '../logger/logger.js';

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        'mailto:' + (process.env.VAPID_EMAIL || 'admin@example.com'),
        vapidKeys.publicKey,
        vapidKeys.privateKey,
    );
}

/**
 * Generate VAPID keys for Web Push.
 * @returns {{publicKey: string, privateKey: string}} Generated VAPID key pair
 */
export const generateVapidKeys = () => {
    const keys = webpush.generateVAPIDKeys();
    log.info('VAPID keys generated');
    return {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
    };
};

const subscriptions = new Map();

/**
 * Push notification service.
 * @class
 */
class PushNotificationService {
    /**
     * Subscribe user to push notifications.
     * @param {string} userId - User ID
     * @param {object} subscription - Push subscription
     */
    static subscribe(userId, subscription) {
        subscriptions.set(userId, subscription);
        log.debug('Push subscription added', { userId });
    }

    /**
     * Unsubscribe user from push notifications.
     * @param {string} userId - User ID
     */
    static unsubscribe(userId) {
        subscriptions.delete(userId);
        log.debug('Push subscription removed', { userId });
    }

    /**
     * Send push notification to user.
     * @param {string} userId - User ID
     * @param {object} payload - Notification payload
     * @returns {Promise<void>}
     */
    static async sendNotification(userId, payload) {
        const subscription = subscriptions.get(userId);
        if (!subscription) {
            return;
        }

        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            log.debug('Push notification sent', { userId });
        } catch (error) {
            if (error.statusCode === 410) {
                subscriptions.delete(userId);
            }
            log.error('Push notification error', { error: error.message });
        }
    }

    /**
     * Send push notification to all subscribers.
     * @param {object} payload - Notification payload
     * @returns {Promise<void>}
     */
    static async broadcast(payload) {
        for (const [userId] of subscriptions) {
            await this.sendNotification(userId, payload);
        }
    }

    /**
     * Get VAPID public key for client.
     * @returns {string} Public key
     */
    static getPublicKey() {
        return vapidKeys.publicKey;
    }
}

export default PushNotificationService;
