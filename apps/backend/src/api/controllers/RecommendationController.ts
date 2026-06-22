import { Request, Response, NextFunction } from 'express';
import { recommendationEngine } from '../../services/RecommendationEngine';
import { learningPathService } from '../../services/LearningPathService';
import { ApiError } from '../middleware/error-handler.middleware';

export class RecommendationController {
  async getRecommendations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { limit = '10' } = req.query;

      const recommendations = await recommendationEngine.getRecommendedProblems(
        req.user.id,
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSkillGraph(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      let skillGraph = await recommendationEngine.getUserSkillGraph(req.user.id);

      if (!skillGraph) {
        // Initialize skill graph
        await recommendationEngine.updateSkillGraph(req.user.id);
        skillGraph = await recommendationEngine.getUserSkillGraph(req.user.id);
      }

      res.status(200).json({
        success: true,
        data: skillGraph,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLearningPath(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const path = await learningPathService.getOrCreateLearningPath(req.user.id);

      res.status(200).json({
        success: true,
        data: path,
      });
    } catch (error) {
      next(error);
    }
  }

  async createLearningPath(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      await learningPathService.generateLearningPath(req.user.id);
      const path = await learningPathService.getOrCreateLearningPath(req.user.id);

      res.status(200).json({
        success: true,
        data: path,
      });
    } catch (error) {
      next(error);
    }
  }

  async completePathNode(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { problemId } = req.body;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      await learningPathService.updateLearningPathProgress(req.user.id, problemId);

      const path = await learningPathService.getOrCreateLearningPath(req.user.id);

      res.status(200).json({
        success: true,
        data: path,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recommendationController = new RecommendationController();
