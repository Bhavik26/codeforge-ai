import { Request, Response, NextFunction } from 'express';
import { codeReviewAIService } from '../../services/CodeReviewAIService';
import { analysisQueue } from '../../queue/AnalysisQueue';
import { ApiError } from '../middleware/error-handler.middleware';
import { prisma } from '../../config/database';

export class CodeReviewController {
  async triggerCodeReview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { submissionId, sync = false } = req.body;

      if (!submissionId || typeof submissionId !== 'string') {
        throw new ApiError(400, 'Invalid submission ID', 'INVALID_ID');
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { userId: true },
      });

      if (!submission) {
        throw new ApiError(404, 'Submission not found', 'NOT_FOUND');
      }

      // Check authorization (must be own submission or admin/moderator)
      if (submission.userId !== req.user.id) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });
        if (!['ADMIN', 'MODERATOR'].includes(user?.role || '')) {
          throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
        }
      }

      if (sync) {
        await codeReviewAIService.reviewSubmissionCode(submissionId);
        const review = await codeReviewAIService.getCodeReviewAnalysis(submissionId);
        res.status(200).json({
          success: true,
          data: review,
        });
      } else {
        await analysisQueue.addCodeReviewJob(submissionId);
        res.status(202).json({
          success: true,
          message: 'AI code review job queued successfully',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getCodeReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { submissionId } = req.params;

      if (!submissionId || typeof submissionId !== 'string') {
        throw new ApiError(400, 'Invalid submission ID', 'INVALID_ID');
      }

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { userId: true },
      });

      if (!submission) {
        throw new ApiError(404, 'Submission not found', 'NOT_FOUND');
      }

      // Authorization check
      if (req.user && submission.userId !== req.user.id) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });
        if (!['ADMIN', 'MODERATOR'].includes(user?.role || '')) {
          throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
        }
      }

      const review = await codeReviewAIService.getCodeReviewAnalysis(submissionId);

      // Parse JSON fields if necessary
      const parsedReview = {
        ...review,
        suggestions: typeof review.suggestions === 'string' ? JSON.parse(review.suggestions) : review.suggestions,
        analysis: review.analysis ? {
          ...review.analysis,
          optimizations: typeof review.analysis.optimizations === 'string' ? JSON.parse(review.analysis.optimizations) : review.analysis.optimizations,
          bugs: typeof review.analysis.bugs === 'string' ? JSON.parse(review.analysis.bugs) : review.analysis.bugs,
        } : null,
      };

      res.status(200).json({
        success: true,
        data: parsedReview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { skip = '0', take = '20' } = req.query;

      const [reviews, total] = await Promise.all([
        prisma.codeReview.findMany({
          where: { userId: req.user.id },
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
          orderBy: { createdAt: 'desc' },
          include: {
            submission: {
              select: {
                id: true,
                language: true,
                createdAt: true,
                problem: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        }),
        prisma.codeReview.count({ where: { userId: req.user.id } }),
      ]);

      res.status(200).json({
        success: true,
        data: reviews,
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
}

export const codeReviewController = new CodeReviewController();
