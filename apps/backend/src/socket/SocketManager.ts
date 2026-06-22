import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';
import { verifyAccessToken } from '../utils/jwt';

export class SocketManager {
  private io: Server;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> [socketIds]

  constructor(io: Server) {
    this.io = io;
  }

  initialize(): void {
    // Middleware for authentication
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error'));
        }

        const user = verifyAccessToken(token);
        (socket as any).user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication error', error);
        next(new Error('Authentication error'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).user.id;
      logger.info(`User connected: ${userId} (${socket.id})`);

      // Track connected users
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, []);
      }
      this.connectedUsers.get(userId)!.push(socket.id);

      // Emit user online event
      this.broadcastUserPresence(userId, 'online');

      // Disconnect handler
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${userId} (${socket.id})`);

        const socketIds = this.connectedUsers.get(userId) || [];
        const index = socketIds.indexOf(socket.id);
        if (index > -1) {
          socketIds.splice(index, 1);
        }

        // If user has no more connections, remove from map
        if (socketIds.length === 0) {
          this.connectedUsers.delete(userId);
          this.broadcastUserPresence(userId, 'offline');
        }
      });

      // ====================================================================
      // SUBMISSION NAMESPACE
      // ====================================================================

      socket.on('submission:subscribe', (data) => {
        socket.join(`submission:${data.submissionId}`);
        logger.debug(`User subscribed to submission: ${data.submissionId}`);
      });

      socket.on('submission:unsubscribe', (data) => {
        socket.leave(`submission:${data.submissionId}`);
      });

      // ====================================================================
      // CONTEST NAMESPACE
      // ====================================================================

      socket.on('contest:subscribe', (data) => {
        socket.join(`contest:${data.contestId}`);
        logger.debug(`User subscribed to contest: ${data.contestId}`);
      });

      socket.on('contest:unsubscribe', (data) => {
        socket.leave(`contest:${data.contestId}`);
      });

      // ====================================================================
      // LEADERBOARD NAMESPACE
      // ====================================================================

      socket.on('leaderboard:subscribe', (data) => {
        socket.join(`leaderboard:${data.contestId}`);
        logger.debug(`User subscribed to leaderboard: ${data.contestId}`);
      });

      socket.on('leaderboard:unsubscribe', (data) => {
        socket.leave(`leaderboard:${data.contestId}`);
      });

      // ====================================================================
      // INTERVIEW NAMESPACE
      // ====================================================================

      socket.on('interview:subscribe', (data) => {
        socket.join(`interview:${data.interviewId}`);
        logger.debug(`User subscribed to interview: ${data.interviewId}`);
      });

      socket.on('interview:unsubscribe', (data) => {
        socket.leave(`interview:${data.interviewId}`);
      });
    });
  }

  // ========================================================================
  // PUBLIC METHODS
  // ========================================================================

  /**
   * Emit submission status update to all subscribers
   */
  emitSubmissionUpdate(submissionId: string, data: any): void {
    this.io.to(`submission:${submissionId}`).emit('submission:progress', data);
  }

  /**
   * Emit submission completed
   */
  emitSubmissionCompleted(submissionId: string, result: any): void {
    this.io.to(`submission:${submissionId}`).emit('submission:completed', result);
  }

  /**
   * Emit submission error
   */
  emitSubmissionError(submissionId: string, error: string): void {
    this.io.to(`submission:${submissionId}`).emit('submission:error', { error });
  }

  /**
   * Emit leaderboard update
   */
  emitLeaderboardUpdate(contestId: string, leaderboard: any): void {
    this.io.to(`leaderboard:${contestId}`).emit('leaderboard:update', leaderboard);
  }

  /**
   * Emit user rank change
   */
  emitRankChange(contestId: string, userId: string, data: any): void {
    this.io.to(`leaderboard:${contestId}`).emit('leaderboard:rank_change', {
      userId,
      ...data,
    });
  }

  /**
   * Emit contest event
   */
  emitContestEvent(contestId: string, event: string, data: any): void {
    this.io.to(`contest:${contestId}`).emit(`contest:${event}`, data);
  }

  /**
   * Emit interview event
   */
  emitInterviewEvent(interviewId: string, event: string, data: any): void {
    this.io.to(`interview:${interviewId}`).emit(`interview:${event}`, data);
  }

  /**
   * Broadcast user presence
   */
  private broadcastUserPresence(userId: string, status: 'online' | 'offline'): void {
    this.io.emit(`user:${status}`, { userId });
  }

  /**
   * Get connected socket IDs for a user
   */
  getUserSockets(userId: string): string[] {
    return this.connectedUsers.get(userId) || [];
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.connectedUsers.get(userId);
    return sockets !== undefined && sockets.length > 0;
  }

  /**
   * Get total connected users
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
