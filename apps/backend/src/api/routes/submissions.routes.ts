import express, { Router } from 'express';
import { SubmissionController } from '../controllers/SubmissionController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router: Router = express.Router();
const submissionController = new SubmissionController();

router.post(
  '/',
  authMiddleware,
  (req, res, next) => submissionController.createSubmission(req, res, next)
);

router.get(
  '/my-submissions',
  authMiddleware,
  (req, res, next) => submissionController.getMySubmissions(req, res, next)
);

router.get(
  '/stats',
  authMiddleware,
  (req, res, next) => submissionController.getSubmissionStats(req, res, next)
);

router.get(
  '/recent',
  optionalAuthMiddleware,
  (req, res, next) => submissionController.getRecentSubmissions(req, res, next)
);

router.get(
  '/problem/:problemId/latest',
  authMiddleware,
  (req, res, next) => submissionController.getLatestSubmissionByUserAndProblem(req, res, next)
);

router.get(
  '/problem/:problemId',
  optionalAuthMiddleware,
  (req, res, next) => submissionController.getSubmissionsByProblem(req, res, next)
);

router.get(
  '/:id',
  optionalAuthMiddleware,
  (req, res, next) => submissionController.getSubmissionById(req, res, next)
);

router.delete(
  '/:id',
  authMiddleware,
  (req, res, next) => submissionController.deleteSubmission(req, res, next)
);

export default router;
