import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { contestController } from '../controllers/ContestController';

const router = express.Router();

router.get('/', (req, res, next) => contestController.getContests(req, res, next));
router.get('/analytics/history', authMiddleware, (req, res, next) => contestController.getAnalyticsHistory(req, res, next));
router.get('/analytics/stats', authMiddleware, (req, res, next) => contestController.getContestStats(req, res, next));
router.get('/:id/analytics', authMiddleware, (req, res, next) => contestController.getContestAnalytics(req, res, next));
router.post('/:id/analytics/analyze', authMiddleware, (req, res, next) => contestController.triggerContestAnalysis(req, res, next));
router.get('/:id', (req, res, next) => contestController.getContestById(req, res, next));
router.post('/', authMiddleware, (req, res, next) => contestController.createContest(req, res, next));

export default router;
