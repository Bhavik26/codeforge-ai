import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res).catch(next));
router.post('/login', (req, res, next) => authController.login(req, res).catch(next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res).catch(next));
router.post('/google/callback', (req, res, next) => authController.googleCallback(req, res).catch(next));

// Protected routes
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res).catch(next));
router.put('/profile', authMiddleware, (req, res, next) => authController.updateProfile(req, res).catch(next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res).catch(next));

export default router;
