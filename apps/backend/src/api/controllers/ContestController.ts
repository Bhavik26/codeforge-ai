import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { contestAnalyticsService } from '../../services/ContestAnalyticsService';
import { ApiError } from '../middleware/error-handler.middleware';
import { logger } from '../../config/logger';

export class ContestController {
  async getContests(req: Request, res: Response, next: NextFunction) {
    try {
      const { skip = '0', take = '20', status } = req.query;

      const whereClause: any = { isPublished: true };
      if (status) {
        whereClause.status = status;
      }

      const [contests, total] = await Promise.all([
        prisma.contest.findMany({
          where: whereClause,
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
          orderBy: { startTime: 'desc' },
        }),
        prisma.contest.count({ where: whereClause }),
      ]);

      res.status(200).json({
        success: true,
        data: contests,
        pagination: {
          total,
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getContestById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid contest ID', 'INVALID_ID');
      }

      const contest = await prisma.contest.findUnique({
        where: { id },
        include: {
          problems: {
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                  tags: true,
                },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!contest) {
        throw new ApiError(404, 'Contest not found', 'NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: contest,
      });
    } catch (error) {
      next(error);
    }
  }

  async createContest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      // Check role
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (!['ADMIN', 'MODERATOR', 'PROBLEM_SETTER'].includes(user?.role || '')) {
        throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
      }

      const {
        title,
        slug,
        description,
        startTime,
        endTime,
        registrationStart,
        registrationEnd,
        difficulty,
        maxParticipants,
        totalPoints,
        scoringType,
        negativeScore,
      } = req.body;

      if (!title || !slug || !startTime || !endTime || !registrationStart || !registrationEnd) {
        throw new ApiError(400, 'Missing required fields', 'VALIDATION_ERROR');
      }

      const contest = await prisma.contest.create({
        data: {
          title,
          slug,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          registrationStart: new Date(registrationStart),
          registrationEnd: new Date(registrationEnd),
          difficulty,
          maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
          totalPoints: totalPoints ? parseInt(totalPoints, 10) : 0,
          scoringType,
          negativeScore: negativeScore ? parseInt(negativeScore, 10) : 0,
          isPublished: true,
        },
      });

      logger.info(`Contest created: ${contest.id} by admin ${req.user.id}`);
      res.status(201).json({
        success: true,
        data: contest,
      });
    } catch (error) {
      next(error);
    }
  }

  async getContestAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id: contestId } = req.params;

      if (!contestId || typeof contestId !== 'string') {
        throw new ApiError(400, 'Invalid contest ID', 'INVALID_ID');
      }

      const analytics = await contestAnalyticsService.getContestAnalytics(
        contestId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async triggerContestAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id: contestId } = req.params;

      if (!contestId || typeof contestId !== 'string') {
        throw new ApiError(400, 'Invalid contest ID', 'INVALID_ID');
      }

      await contestAnalyticsService.analyzeContestPerformance(contestId, req.user.id);
      const analytics = await contestAnalyticsService.getContestAnalytics(
        contestId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { skip = '0', take = '20' } = req.query;

      const result = await contestAnalyticsService.getUserContestHistory(
        req.user.id,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.analytics,
        pagination: {
          total: result.total,
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getContestStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const stats = await contestAnalyticsService.getContestStatistics(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contestController = new ContestController();
