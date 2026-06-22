import { Request, Response, NextFunction } from 'express';
import { TestCaseService } from '../../services/TestCaseService';
import {
  createTestCaseSchema,
  updateTestCaseSchema,
  bulkCreateTestCasesSchema,
} from '../../schemas/testcase.schema';
import { ApiError } from '../middleware/error-handler.middleware';
import { logger } from '../../config/logger';

export class TestCaseController {
  private testCaseService: TestCaseService;

  constructor() {
    this.testCaseService = new TestCaseService();
  }

  async createTestCase(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = createTestCaseSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const testCase = await this.testCaseService.createTestCase(validation.data);

      logger.info(`Test case created: ${testCase.id}`);
      res.status(201).json({
        success: true,
        data: testCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateTestCases(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = bulkCreateTestCasesSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const testCases = await this.testCaseService.bulkCreateTestCases(validation.data);

      logger.info(`${testCases.length} test cases created for problem ${validation.data.problemId}`);
      res.status(201).json({
        success: true,
        data: testCases,
        count: testCases.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTestCasesByProblem(req: Request, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params;
      const { includeHidden = 'false', skip = '0', take = '100' } = req.query;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const testCases = await this.testCaseService.getTestCasesByProblemId(
        problemId,
        {
          includeHidden: includeHidden === 'true',
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
        }
      );

      res.status(200).json({
        success: true,
        data: testCases,
        count: testCases.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTestCaseById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid test case ID', 'INVALID_ID');
      }

      const testCase = await this.testCaseService.getTestCaseById(id);

      res.status(200).json({
        success: true,
        data: testCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async getExampleTestCases(req: Request, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const testCases = await this.testCaseService.getExampleTestCases(problemId);

      res.status(200).json({
        success: true,
        data: testCases,
        count: testCases.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTestCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid test case ID', 'INVALID_ID');
      }

      const validation = updateTestCaseSchema.safeParse(req.body);
      if (!validation.success) {
        throw new ApiError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
      }

      const testCase = await this.testCaseService.updateTestCase(id, validation.data);

      logger.info(`Test case updated: ${id}`);
      res.status(200).json({
        success: true,
        data: testCase,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTestCase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        throw new ApiError(400, 'Invalid test case ID', 'INVALID_ID');
      }

      await this.testCaseService.deleteTestCase(id);

      logger.info(`Test case deleted: ${id}`);
      res.status(200).json({
        success: true,
        message: 'Test case deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAllTestCases(req: Request, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      await this.testCaseService.deleteAllTestCases(problemId);

      logger.info(`All test cases deleted for problem ${problemId}`);
      res.status(200).json({
        success: true,
        message: 'All test cases deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async countTestCases(req: Request, res: Response, next: NextFunction) {
    try {
      const { problemId } = req.params;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const count = await this.testCaseService.countTestCases(problemId);

      res.status(200).json({
        success: true,
        data: { problemId, count },
      });
    } catch (error) {
      next(error);
    }
  }
}
