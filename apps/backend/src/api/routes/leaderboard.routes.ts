import express from 'express';
import { UserRepository } from '../../repositories/UserRepository';

const router = express.Router();
const userRepository = new UserRepository();

router.get('/global', async (_req, res, next) => {
  try {
    const limit = parseInt(_req.query.limit as string || '50', 10);
    const users = await userRepository.findTopRatedUsers(limit);
    
    const data = users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      rating: u.rating,
      totalSubmissions: u.totalSubmissions,
      acceptedSubmissions: u.acceptedSubmissions,
    }));
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/contest/:contestId', (_req, res) => res.json({ message: 'GET /leaderboard/contest/:contestId - not yet implemented' }));

export default router;
