import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// All admin routes require auth
router.use(authMiddleware);

router.get('/stats', (_req, res) => res.json({ message: 'GET /admin/stats - not yet implemented' }));
router.get('/workers', (_req, res) => res.json({ message: 'GET /admin/workers - not yet implemented' }));
router.get('/queue-status', (_req, res) => res.json({ message: 'GET /admin/queue-status - not yet implemented' }));

export default router;
