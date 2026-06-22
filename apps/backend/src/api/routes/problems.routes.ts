import express, { Router } from 'express';
import { ProblemController } from '../controllers/ProblemController';
import { TestCaseController } from '../controllers/TestCaseController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { requireProblemSetter, requireAdmin } from '../middleware/role.middleware';

const router: Router = express.Router();
const problemController = new ProblemController();
const testCaseController = new TestCaseController();

router.post(
  '/',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => problemController.createProblem(req, res, next)
);

router.get(
  '/search',
  optionalAuthMiddleware,
  (req, res, next) => problemController.searchProblems(req, res, next)
);

router.get(
  '/difficulty/:difficulty',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getProblemsByDifficulty(req, res, next)
);

router.get(
  '/tag/:tag',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getProblemsByTag(req, res, next)
);

router.get(
  '/top',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getTopProblems(req, res, next)
);

router.get(
  '/recent',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getRecentProblems(req, res, next)
);

router.get(
  '/:id',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getProblemById(req, res, next)
);

router.get(
  '/slug/:slug',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getProblemBySlug(req, res, next)
);

router.get(
  '/:id/stats',
  optionalAuthMiddleware,
  (req, res, next) => problemController.getProblemStats(req, res, next)
);

router.put(
  '/:id',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => problemController.updateProblem(req, res, next)
);

router.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  (req, res, next) => problemController.deleteProblem(req, res, next)
);

router.post(
  '/:id/publish',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => problemController.publishProblem(req, res, next)
);

router.post(
  '/:id/unpublish',
  authMiddleware,
  requireAdmin,
  (req, res, next) => problemController.unpublishProblem(req, res, next)
);

router.post(
  '/:problemId/testcases',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.createTestCase(req, res, next)
);

router.post(
  '/:problemId/testcases/bulk',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.bulkCreateTestCases(req, res, next)
);

router.get(
  '/:problemId/testcases',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.getTestCasesByProblem(req, res, next)
);

router.get(
  '/:problemId/testcases/examples',
  optionalAuthMiddleware,
  (req, res, next) => testCaseController.getExampleTestCases(req, res, next)
);

router.get(
  '/:problemId/testcases/count',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.countTestCases(req, res, next)
);

router.get(
  '/testcases/:id',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.getTestCaseById(req, res, next)
);

router.put(
  '/testcases/:id',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.updateTestCase(req, res, next)
);

router.delete(
  '/testcases/:id',
  authMiddleware,
  requireProblemSetter,
  (req, res, next) => testCaseController.deleteTestCase(req, res, next)
);

router.delete(
  '/:problemId/testcases',
  authMiddleware,
  requireAdmin,
  (req, res, next) => testCaseController.deleteAllTestCases(req, res, next)
);

export default router;
