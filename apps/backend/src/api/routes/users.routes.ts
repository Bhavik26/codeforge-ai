import express from 'express';

const router = express.Router();

router.get('/:id', (_req, res) => res.json({ message: 'GET /users/:id - not yet implemented' }));
router.get('/:id/stats', (_req, res) => res.json({ message: 'GET /users/:id/stats - not yet implemented' }));

export default router;
