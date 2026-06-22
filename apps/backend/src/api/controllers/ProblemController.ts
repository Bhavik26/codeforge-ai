import { Request, Response, NextFunction } from 'express';
import { ProblemService } from '../../services/ProblemService';
import {
  createProblemSchema,
  updateProblemSchema,
  searchProblemSchema,
} from '../../schemas/problem.schema';
import { ApiError } from '../middleware/error-handler.middleware';
import { logger } from '../../config/logger';

export class ProblemController {
  private problemService: ProblemService;

  constructor() {
    this.problemService = new ProblemService();
  }

  async createProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createProblemSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const problem = await this.problemService.createProblem(validation.data);

      logger.info(`Problem created: ${problem.id}`);
      res.status(201).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblemById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const problem = await this.problemService.getProblemById(id);

      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblemBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      if (!slug || typeof slug !== 'string') {
        throw new ApiError(400, 'Invalid problem slug', 'INVALID_SLUG');
      }

      const problem = await this.problemService.getProblemBySlug(slug);

      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const validation = updateProblemSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const problem = await this.problemService.updateProblem(id, validation.data);

      logger.info(`Problem updated: ${id}`);
      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      await this.problemService.deleteProblem(id);

      logger.info(`Problem deleted: ${id}`);
      res.status(200).json({
        success: true,
        message: 'Problem deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async searchProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = searchProblemSchema.safeParse(req.query);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const result = await this.problemService.searchProblems(validation.data);

      res.status(200).json({
        success: true,
        data: result.problems,
        pagination: {
          total: result.total,
          skip: validation.data.skip || 0,
          take: validation.data.take || 20,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblemsByDifficulty(req: Request, res: Response, next: NextFunction) {
    try {
      const { difficulty } = req.params;
      const { skip = '0', take = '20' } = req.query;

      if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        throw new ApiError(400, 'Invalid difficulty level', 'INVALID_DIFFICULTY');
      }

      const result = await this.problemService.getProblemsByDifficulty(
        difficulty as any,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.problems,
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

  async getProblemsByTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { tag } = req.params;
      const { skip = '0', take = '20' } = req.query;

      if (!tag || typeof tag !== 'string') {
        throw new ApiError(400, 'Invalid tag', 'INVALID_TAG');
      }

      const result = await this.problemService.getProblemsByTag(
        tag,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.problems,
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

  async publishProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const problem = await this.problemService.publishProblem(id);

      logger.info(`Problem published: ${id}`);
      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async unpublishProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const problem = await this.problemService.unpublishProblem(id);

      logger.info(`Problem unpublished: ${id}`);
      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const stats = await this.problemService.getProblemStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '10' } = req.query;

      const problems = await this.problemService.getTopProblems(
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: problems,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = '10' } = req.query;

      const problems = await this.problemService.getRecentProblems(
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: problems,
      });
    } catch (error) {
      next(error);
    }
  }
}
