import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { codeReviewController } from '../controllers/CodeReviewController';

const router = express.Router();

router.post('/', authMiddleware, (req, res, next) => codeReviewController.triggerCodeReview(req, res, next));
router.get('/submission/:submissionId', optionalAuthMiddleware, (req, res, next) => codeReviewController.getCodeReview(req, res, next));
router.get('/', authMiddleware, (req, res, next) => codeReviewController.getMyReviews(req, res, next));

export default router;
