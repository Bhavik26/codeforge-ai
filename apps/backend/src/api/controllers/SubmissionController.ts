import { Request, Response, NextFunction } from 'express';
import { SubmissionService } from '../../services/SubmissionService';
import { createSubmissionSchema } from '../../schemas/submission.schema';
import { ApiError } from '../middleware/error-handler.middleware';
import { logger } from '../../config/logger';
import { judgeQueue } from '../../queue/JudgeQueue';

export class SubmissionController {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService(judgeQueue);
  }

  async createSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const validation = createSubmissionSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const submission = await this.submissionService.createSubmission(
        req.user.id,
        validation.data
      );

      logger.info(`Submission created: ${submission.id} by user ${req.user.id}`);
      res.status(201).json({
        success: true,
        data: {
          id: submission.id,
          status: submission.status,
          verdict: submission.verdict,
          createdAt: submission.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid submission ID', 'INVALID_ID');
      }

      const submission = await this.submissionService.getSubmissionById(id);

      if (req.user && submission.userId !== req.user.id) {
        const user = await req.app.locals.prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });

        if (!['ADMIN', 'MODERATOR'].includes(user?.role || '')) {
          throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
        }
      }

      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMySubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { skip = '0', take = '20' } = req.query;

      const result = await this.submissionService.getSubmissionsByUserId(
        req.user.id,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.submissions,
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

  async getSubmissionsByProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params;
      const { skip = '0', take = '20' } = req.query;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const result = await this.submissionService.getSubmissionsByProblemId(
        problemId,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.submissions,
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

  async getLatestSubmissionByUserAndProblem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { problemId } = req.params;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const submission = await this.submissionService.getLatestSubmissionByUserAndProblem(
        req.user.id,
        problemId
      );

      if (!submission) {
        throw new ApiError(404, 'No submission found', 'NOT_FOUND');
      }

      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const stats = await this.submissionService.getSubmissionStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '10' } = req.query;

      const submissions = await this.submissionService.getRecentSubmissions(
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid submission ID', 'INVALID_ID');
      }

      const submission = await this.submissionService.getSubmissionById(id);

      if (submission.userId !== req.user.id) {
        throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
      }

      await this.submissionService.deleteSubmission(id);

      logger.info(`Submission deleted: ${id}`);
      res.status(200).json({
        success: true,
        message: 'Submission deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
