import { Server } from 'socket.io';
import { log } from '../logger/logger.js';
import { setWebSocketServer } from './socket-instance.js';
import { getEnvironmentConfig } from '../../config/environment.js';
import supabase from '../supabase/config/supabaseClient.js';

const envConfig = getEnvironmentConfig();

/**
 * Creates the Socket.io handshake authentication middleware.
 *
 * Extracts the bearer token from the handshake payload (or Authorization
 * header), validates it against Supabase Auth and attaches the verified
 * user id to `socket.userId` before any event handler can run. Sockets
 * without a valid token are rejected during the handshake itself.
 * @param {object} supabaseClient - Supabase client (injectable for testing)
 * @returns {Function} Socket.io middleware (socket, next)
 */
export const createSocketAuthMiddleware = (supabaseClient = supabase) => {
    return async (socket, next) => {
        try {
            const token =
                socket.handshake?.auth?.token ||
                socket.handshake?.headers?.authorization?.split(' ')[1];

            if (!token) {
                log.warn('WebSocket connection rejected: missing token', {
                    socketId: socket.id,
                });
                return next(new Error('Authentication required'));
            }

            const { data, error } = await supabaseClient.auth.getUser(token);

            if (error || !data?.user) {
                log.warn('WebSocket connection rejected: invalid token', {
                    socketId: socket.id,
                });
                return next(new Error('Invalid or expired token'));
            }

            socket.userId = data.user.id;
            log.debug('WebSocket handshake authenticated', {
                userId: socket.userId,
                socketId: socket.id,
            });
            return next();
        } catch (error) {
            log.error('WebSocket auth middleware error', { error: error.message });
            return next(new Error('Authentication failed'));
        }
    };
};

/**
 * WebSocket server for real-time communication.
 */
class WebSocketServer {
    /**
     * Initialize WebSocket server.
     * @param {object} httpServer - HTTP server instance
     */
    constructor(httpServer) {
        setWebSocketServer(this);
        this.io = new Server(httpServer, {
            cors: {
                origin: envConfig.corsOrigins.length > 0 ? envConfig.corsOrigins : true,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        this.connectedUsers = new Map();
        this.setupAuthMiddleware();
        this.setupEventHandlers();

        log.info('WebSocket server initialized');
    }

    /**
     * Register handshake authentication middleware.
     */
    setupAuthMiddleware() {
        this.io.use(createSocketAuthMiddleware());
    }

    /**
     * Setup WebSocket event handlers.
     */
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            const userId = socket.userId;

            if (!userId) {
                log.warn('Unauthenticated socket disconnected', { socketId: socket.id });
                socket.disconnect(true);
                return;
            }

            this.connectedUsers.set(userId, socket.id);
            socket.join(`user:${userId}`);
            log.debug('Client connected', { userId, socketId: socket.id });

            // Identity is established during the authenticated handshake.
            // Any client-supplied user id is ignored; an optional ack
            // (in any position) returns the verified identity for backward
            // compatibility with clients that emit 'authenticate'.
            socket.on('authenticate', (...args) => {
                const ack = args.find((arg) => typeof arg === 'function');
                if (ack) {
                    ack({ userId });
                }
                log.debug('User authenticated', { userId, socketId: socket.id });
            });

            socket.on('join-room', (room) => {
                if (
                    typeof room === 'string' &&
                    room.startsWith('user:') &&
                    room !== `user:${userId}`
                ) {
                    log.warn('Blocked attempt to join another user room', {
                        room,
                        userId,
                        socketId: socket.id,
                    });
                    return;
                }
                socket.join(room);
                log.debug('User joined room', { room, socketId: socket.id });
            });

            socket.on('leave-room', (room) => {
                socket.leave(room);
                log.debug('User left room', { room, socketId: socket.id });
            });

            socket.on('typing', (data) => {
                socket.to(data.room).emit('user-typing', {
                    userId: socket.userId,
                    room: data.room,
                });
            });

            socket.on('stop-typing', (data) => {
                socket.to(data.room).emit('user-stop-typing', {
                    userId: socket.userId,
                    room: data.room,
                });
            });

            socket.on('private-message', (data) => {
                const targetSocketId = this.connectedUsers.get(data.targetUserId);
                if (targetSocketId) {
                    this.io.to(targetSocketId).emit('new-message', {
                        from: socket.userId,
                        message: data.message,
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            socket.on('disconnect', () => {
                if (socket.userId && this.connectedUsers.get(socket.userId) === socket.id) {
                    this.connectedUsers.delete(socket.userId);
                }
                log.debug('Client disconnected', { socketId: socket.id });
            });
        });
    }

    /**
     * Emit event to specific user.
     * @param {string} userId - User ID
     * @param {string} event - Event name
     * @param {any} data - Data to emit
     */
    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    /**
     * Emit event to all connected clients.
     * @param {string} event - Event name
     * @param {any} data - Data to emit
     */
    emitToAll(event, data) {
        this.io.emit(event, data);
    }

    /**
     * Emit event to room.
     * @param {string} room - Room name
     * @param {string} event - Event name
     * @param {any} data - Data to emit
     */
    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }

    /**
     * Get connected users count.
     * @returns {number} Number of connected users
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    /**
     * Get all connected users.
     * @returns {string[]} Array of user IDs
     */
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
}

export default WebSocketServer;
