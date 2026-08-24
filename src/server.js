import createApp from './app.js';
import mongoose from 'mongoose';
import { getEnvironmentConfig, validateEnvironment } from './config/environment.js';
import logger from './infrastructure/logger/logger.js';
import { WebSocketServer } from './infrastructure/websocket/index.js';

/**
 * Start the server
 * @description Initializes database connection and starts the Express server
 * @returns {Promise<void>}
 */
const startServer = async () => {
    try {
        validateEnvironment();

        const envConfig = getEnvironmentConfig();
        const PORT = envConfig.port;

        const app = await createApp();

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info('╔══════════════════════════════════════════════════════════════════╗');
            logger.info('║                                                                  ║');
            logger.info(
                '║     CommonMarketplace API Server Started on server                       ║',
            );
            logger.info('║                                                                  ║');
            logger.info(
                `║     Port: ${PORT}${' '.repeat(Math.max(0, 58 - PORT.toString().length))}║`,
            );
            logger.info(
                `║     Environment: ${envConfig.nodeEnv}${' '.repeat(Math.max(0, 46 - envConfig.nodeEnv.length))}║`,
            );
            logger.info(
                `║     API URL: ${envConfig.apiUrl}${' '.repeat(Math.max(0, 51 - envConfig.apiUrl.length))}║`,
            );
            logger.info('║                                                                  ║');

            if (envConfig.enableSwagger) {
                logger.info(
                    `║     Documentation: ${envConfig.apiUrl}/api-docs${' '.repeat(Math.max(0, 33 - envConfig.apiUrl.length))}║`,
                );
            }

            logger.info(
                `║     Health Check: ${envConfig.apiUrl}/health${' '.repeat(Math.max(0, 35 - envConfig.apiUrl.length))}║`,
            );
            logger.info('║                                                                  ║');
            logger.info('╚══════════════════════════════════════════════════════════════════╝');
        });

        // app.listen() returns the bound server synchronously; the callback
        // above only runs once listening, so this reference is always set
        // before any shutdown signal can arrive.
        const wsServer = new WebSocketServer(server);

        let isShuttingDown = false;

        const gracefulShutdown = async (signal) => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            logger.warn(`${signal} signal received: closing server`);

            const forceExitTimer = setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);

            try {
                await wsServer.close();
                logger.info('WebSocket server closed');
                await server.close();
                logger.info('HTTP server closed');
                await mongoose.connection.close(false);
                logger.info('MongoDB connection closed');
                clearTimeout(forceExitTimer);
                process.exit(0);
            } catch (error) {
                logger.error('Error during graceful shutdown', {
                    message: error.message,
                    stack: error.stack,
                });
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        return server;
    } catch (error) {
        logger.error('Failed to start server', {
            message: error.message,
            stack: error.stack,
        });
        process.exit(1);
    }
};

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise,
    });
    process.exit(1);
});

startServer();
