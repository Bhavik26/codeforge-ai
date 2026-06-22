import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { interviewController } from '../controllers/InterviewController';

const router = express.Router();

router.post('/', authMiddleware, (req, res, next) => interviewController.startInterview(req, res, next));
router.get('/stats', authMiddleware, (req, res, next) => interviewController.getInterviewStats(req, res, next));
router.post('/:id/answer', authMiddleware, (req, res, next) => interviewController.submitAnswer(req, res, next));
router.post('/:id/complete', authMiddleware, (req, res, next) => interviewController.completeInterview(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => interviewController.getInterviewSession(req, res, next));
router.get('/', authMiddleware, (req, res, next) => interviewController.getMyInterviews(req, res, next));

export default router;
