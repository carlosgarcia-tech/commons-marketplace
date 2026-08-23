import WebSocketServer from '../../../src/infrastructure/websocket/socketServer.js';
import supabase from '../../../src/infrastructure/supabase/config/supabaseClient.js';

let mockIoUseMiddleware;
let mockIoConnectionHandler;

jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
        use: jest.fn((middleware) => {
            mockIoUseMiddleware = middleware;
        }),
        on: jest.fn((event, handler) => {
            if (event === 'connection') {
                mockIoConnectionHandler = handler;
            }
        }),
        to: jest.fn().mockReturnValue({ emit: jest.fn() }),
        emit: jest.fn(),
        close: jest.fn((callback) => callback()),
    })),
}));

jest.mock('../../../src/infrastructure/logger/logger.js', () => ({
    log: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

jest.mock('../../../src/infrastructure/supabase/config/supabaseClient.js', () => ({
    __esModule: true,
    default: {
        auth: {
            getUser: jest.fn(),
        },
    },
}));

describe('WebSocketServer', () => {
    let mockHttpServer;
    let webSocketServer;
    let socketHandlers;

    const makeSocket = (overrides = {}) => {
        const socket = {
            id: 'sock1',
            userId: null,
            handshake: {},
            join: jest.fn(),
            leave: jest.fn(),
            disconnect: jest.fn(),
            to: Object.assign(jest.fn().mockReturnThis(), { emit: jest.fn() }),
            on: jest.fn((event, handler) => {
                socketHandlers[event] = handler;
            }),
            ...overrides,
        };
        return socket;
    };

    const connectSocket = async (overrides = {}) => {
        const socket = makeSocket(overrides);
        mockIoConnectionHandler(socket);
        return socket;
    };

    beforeEach(() => {
        mockHttpServer = {};
        webSocketServer = new WebSocketServer(mockHttpServer);
        socketHandlers = {};
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize WebSocket server with http server', () => {
            expect(webSocketServer.io).toBeDefined();
        });

        it('should initialize connectedUsers as empty Map', () => {
            expect(webSocketServer.connectedUsers).toBeInstanceOf(Map);
        });

        it('should setup connection handler', () => {
            expect(webSocketServer.io.on).toHaveBeenCalledWith('connection', expect.any(Function));
        });

        it('should register handshake auth middleware before event handlers', () => {
            expect(webSocketServer.io.use).toHaveBeenCalledTimes(1);
            expect(mockIoUseMiddleware).toEqual(expect.any(Function));
        });
    });

    describe('createSocketAuthMiddleware', () => {
        let socket;
        let next;

        beforeEach(() => {
            socket = makeSocket();
            next = jest.fn();
        });

        it('should reject connection when no token is provided', async () => {
            await mockIoUseMiddleware(socket, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toContain('Authentication');
            expect(supabase.auth.getUser).not.toHaveBeenCalled();
        });

        it('should reject connection when token is invalid', async () => {
            socket.handshake.auth = { token: 'invalid-token' }; // eslint-disable-line camelcase
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Invalid JWT'),
            });

            await mockIoUseMiddleware(socket, next);

            expect(supabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toContain('Invalid or expired');
            expect(socket.userId).toBeNull();
        });

        it('should accept connection with valid handshake token and attach verified user id', async () => {
            socket.handshake.auth = { token: 'valid-token' }; // eslint-disable-line camelcase
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-123' } },
                error: null,
            });

            await mockIoUseMiddleware(socket, next);

            expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
            expect(socket.userId).toBe('user-123');
            expect(next).toHaveBeenCalledWith();
        });

        it('should fall back to Authorization header when handshake auth is missing', async () => {
            socket.handshake.headers = { authorization: 'Bearer header-token' };
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: 'user-456' } },
                error: null,
            });

            await mockIoUseMiddleware(socket, next);

            expect(supabase.auth.getUser).toHaveBeenCalledWith('header-token');
            expect(socket.userId).toBe('user-456');
            expect(next).toHaveBeenCalledWith();
        });

        it('should reject connection when getUser throws unexpectedly', async () => {
            socket.handshake.auth = { token: 'valid-token' }; // eslint-disable-line camelcase
            supabase.auth.getUser.mockRejectedValue(new Error('Network failure'));

            await mockIoUseMiddleware(socket, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].message).toContain('Authentication failed');
        });
    });

    describe('connection handlers', () => {
        it('should register and join room for authenticated user on connect', async () => {
            const socket = await connectSocket({ userId: 'user-123' });

            expect(webSocketServer.connectedUsers.get('user-123')).toBe('sock1');
            expect(socket.join).toHaveBeenCalledWith('user:user-123');
        });

        it('should disconnect sockets without a verified user id', async () => {
            const socket = await connectSocket();

            expect(socket.disconnect).toHaveBeenCalledWith(true);
            expect(webSocketServer.connectedUsers.size).toBe(0);
        });

        it('should ignore client-supplied id on authenticate and ack verified identity', async () => {
            await connectSocket({ userId: 'user-123' });
            const callback = jest.fn();

            socketHandlers.authenticate('victim-user', callback);

            expect(callback).toHaveBeenCalledWith({ userId: 'user-123' });
            expect(webSocketServer.connectedUsers.has('victim-user')).toBe(false);
        });

        it('should not crash when authenticate ack callback is not provided', async () => {
            await connectSocket({ userId: 'user-123' });

            expect(() => socketHandlers.authenticate('whatever')).not.toThrow();
        });

        describe('join-room', () => {
            let socket;

            beforeEach(async () => {
                socket = await connectSocket({ userId: 'user-123' });
            });

            it('should allow joining own user room', () => {
                socketHandlers['join-room']('user:user-123');

                expect(socket.join).toHaveBeenCalledWith('user:user-123');
            });

            it('should block joining another user room', () => {
                socketHandlers['join-room']('user:victim-999');

                expect(socket.join).not.toHaveBeenCalledWith('user:victim-999');
            });

            it('should allow joining conversation rooms', () => {
                socketHandlers['join-room']('conversation:abc');

                expect(socket.join).toHaveBeenCalledWith('conversation:abc');
            });
        });

        it('should relay private messages with the verified sender id', async () => {
            const emitter = { emit: jest.fn() };
            webSocketServer.io.to.mockReturnValue(emitter);
            webSocketServer.connectedUsers.set('receiver', 'sock-receiver');

            const attackerSocket = makeSocket({
                userId: 'attacker-verified',
                id: 'sock-attacker',
            });
            mockIoConnectionHandler(attackerSocket);

            socketHandlers['private-message']({
                targetUserId: 'receiver',
                message: 'spoofed content',
            });

            expect(webSocketServer.io.to).toHaveBeenCalledWith('sock-receiver');
            expect(emitter.emit).toHaveBeenCalledWith(
                'new-message',
                expect.objectContaining({
                    from: 'attacker-verified',
                    message: 'spoofed content',
                }),
            );
        });

        it('should clean up connected users on disconnect only for matching socket', async () => {
            const socket = await connectSocket({ userId: 'user-123' });

            expect(webSocketServer.connectedUsers.has('user-123')).toBe(true);

            socketHandlers.disconnect.call(socket);

            expect(webSocketServer.connectedUsers.has('user-123')).toBe(false);
        });

        it('should keep mapping when disconnect event belongs to a different socket', async () => {
            const socket = await connectSocket({ userId: 'user-123', id: 'sock-a' });

            // Simulate a second device having taken over the user slot
            webSocketServer.connectedUsers.set('user-123', 'sock-b');

            socketHandlers.disconnect.call(socket);

            expect(webSocketServer.connectedUsers.get('user-123')).toBe('sock-b');
        });
    });

    describe('emitToUser', () => {
        it('should emit event to specific user', () => {
            const userId = 'user123';
            const event = 'testEvent';
            const data = { message: 'test' };

            webSocketServer.connectedUsers.set(userId, 'socket123');
            webSocketServer.emitToUser(userId, event, data);

            expect(webSocketServer.io.to).toHaveBeenCalledWith('socket123');
        });

        it('should not emit if user not found', () => {
            const userId = 'nonexistent';
            const event = 'testEvent';
            const data = { message: 'test' };

            webSocketServer.emitToUser(userId, event, data);

            expect(webSocketServer.io.to).not.toHaveBeenCalled();
        });
    });

    describe('emitToAll', () => {
        it('should emit event to all clients', () => {
            const event = 'testEvent';
            const data = { message: 'test' };

            webSocketServer.emitToAll(event, data);

            expect(webSocketServer.io.emit).toHaveBeenCalledWith(event, data);
        });
    });

    describe('emitToRoom', () => {
        it('should emit event to room', () => {
            const room = 'testRoom';
            const event = 'testEvent';
            const data = { message: 'test' };

            webSocketServer.emitToRoom(room, event, data);

            expect(webSocketServer.io.to).toHaveBeenCalledWith(room);
        });
    });

    describe('getConnectedUsersCount', () => {
        it('should return number of connected users', () => {
            webSocketServer.connectedUsers.set('user1', 'socket1');
            webSocketServer.connectedUsers.set('user2', 'socket2');

            expect(webSocketServer.getConnectedUsersCount()).toBe(2);
        });

        it('should return 0 when no users connected', () => {
            expect(webSocketServer.getConnectedUsersCount()).toBe(0);
        });
    });

    describe('getConnectedUsers', () => {
        it('should return array of connected user IDs', () => {
            webSocketServer.connectedUsers.set('user1', 'socket1');
            webSocketServer.connectedUsers.set('user2', 'socket2');

            const users = webSocketServer.getConnectedUsers();

            expect(users).toContain('user1');
            expect(users).toContain('user2');
        });

        it('should return empty array when no users connected', () => {
            expect(webSocketServer.getConnectedUsers()).toEqual([]);
        });
    });

    describe('close', () => {
        it('should close the underlying io server and resolve', async () => {
            await expect(webSocketServer.close()).resolves.toBeUndefined();
            expect(webSocketServer.io.close).toHaveBeenCalledTimes(1);
        });
    });
});
