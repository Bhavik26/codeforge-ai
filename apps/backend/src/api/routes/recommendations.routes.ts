import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { recommendationController } from '../controllers/RecommendationController';

const router = express.Router();

router.get('/', authMiddleware, (req, res, next) => recommendationController.getRecommendations(req, res, next));
router.get('/skill-graph', authMiddleware, (req, res, next) => recommendationController.getSkillGraph(req, res, next));
router.get('/learning-path', authMiddleware, (req, res, next) => recommendationController.getLearningPath(req, res, next));
router.post('/learning-path', authMiddleware, (req, res, next) => recommendationController.createLearningPath(req, res, next));
router.post('/learning-path/complete', authMiddleware, (req, res, next) => recommendationController.completePathNode(req, res, next));

export default router;
