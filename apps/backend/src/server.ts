import { createServer } from 'http';
import { createApp, setupWebSocket } from './app';
import { config } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { initializeQueues } from './queue/Queue';
import { initializeWorkers, shutdownWorkers } from './workers/JudgeWorker';
import { analysisQueue } from './queue/AnalysisQueue';

const app = createApp();
const httpServer = createServer(app);
const io = setupWebSocket(httpServer);

// Attach io to app for use in routes
(app as any).io = io;

const PORT = config.server.port;
const HOST = config.server.host;

const startServer = async () => {
  try {
    // ============================================================================
    // DATABASE CONNECTION
    // ============================================================================

    logger.info('Connecting to PostgreSQL...');
    await prisma.$connect();
    logger.info('PostgreSQL connected successfully');

    // ============================================================================
    // REDIS CONNECTION
    // ============================================================================

    logger.info('Connecting to Redis...');
    await redis.ping();
    logger.info('Redis connected successfully');

    // ============================================================================
    // INITIALIZE QUEUES
    // ============================================================================

    logger.info('Initializing message queues...');
    await initializeQueues();
    await analysisQueue.startProcessing(5);
    logger.info('Message queues initialized');

    // ============================================================================
    // INITIALIZE WORKERS
    // ============================================================================

    logger.info('Initializing judge workers...');
    await initializeWorkers();
    logger.info('Judge workers initialized');

    // ============================================================================
    // START HTTP SERVER
    // ============================================================================

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running at http://${HOST}:${PORT}`);
      logger.info(`📊 Health check: http://${HOST}:${PORT}/health`);
      logger.info(`🔌 WebSocket enabled`);
      logger.info(`Environment: ${config.env}`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      await shutdownWorkers();
      logger.info('Workers shut down');
    } catch (error) {
      logger.error('Error shutting down workers', error);
    }

    try {
      await analysisQueue.close();
      logger.info('Analysis queue worker closed');
    } catch (error) {
      logger.error('Error closing analysis queue worker', error);
    }

    try {
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection', error);
    }

    try {
      await prisma.$disconnect();
      logger.info('PostgreSQL connection closed');
    } catch (error) {
      logger.error('Error closing PostgreSQL connection', error);
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30s');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
