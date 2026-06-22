import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './api/middleware/error-handler.middleware';
import { rateLimiter } from './api/middleware/rate-limiter.middleware';
import { requestLogger } from './api/middleware/logging.middleware';

// Import routes
import authRoutes from './api/routes/auth.routes';
import problemRoutes from './api/routes/problems.routes';
import submissionRoutes from './api/routes/submissions.routes';
import contestRoutes from './api/routes/contests.routes';
import reviewRoutes from './api/routes/reviews.routes';
import interviewRoutes from './api/routes/interviews.routes';
import leaderboardRoutes from './api/routes/leaderboard.routes';
import recommendationRoutes from './api/routes/recommendations.routes';
import userRoutes from './api/routes/users.routes';
import adminRoutes from './api/routes/admin.routes';

// Import WebSocket manager
import { SocketManager } from './socket/SocketManager';

export const createApp = (): Express => {
  const app = express();

  // ============================================================================
  // SECURITY & MIDDLEWARE
  // ============================================================================

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Logging
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  app.use(requestLogger);

  // Rate limiting (global)
  app.use(rateLimiter);

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ============================================================================
  // API ROUTES
  // ============================================================================

  const apiV1 = '/api/v1';

  app.use(`${apiV1}/auth`, authRoutes);
  app.use(`${apiV1}/problems`, problemRoutes);
  app.use(`${apiV1}/submissions`, submissionRoutes);
  app.use(`${apiV1}/contests`, contestRoutes);
  app.use(`${apiV1}/reviews`, reviewRoutes);
  app.use(`${apiV1}/interviews`, interviewRoutes);
  app.use(`${apiV1}/leaderboard`, leaderboardRoutes);
  app.use(`${apiV1}/recommendations`, recommendationRoutes);
  app.use(`${apiV1}/users`, userRoutes);
  app.use(`${apiV1}/admin`, adminRoutes);

  // ============================================================================
  // 404 HANDLER
  // ============================================================================

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      method: req.method,
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  app.use(errorHandler);

  return app;
};

export const setupWebSocket = (httpServer: ReturnType<typeof createServer>): SocketServer => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.cors.origins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB
    connectTimeout: 45000,
  });

  // Initialize WebSocket manager
  const socketManager = new SocketManager(io);
  socketManager.initialize();

  // Log socket connections
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default createApp;
