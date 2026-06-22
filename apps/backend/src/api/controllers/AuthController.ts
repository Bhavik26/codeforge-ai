import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { ApiError } from '../middleware/error-handler.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { UserRepository } from '../../repositories/UserRepository';

export class AuthController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(req: Request, res: Response): Promise<void> {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      throw new ApiError(400, 'Missing required fields', 'VALIDATION_ERROR');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters', 'WEAK_PASSWORD');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      OR: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409, 'Email or username already in use', 'DUPLICATE_USER');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          firstName,
          lastName,
          userStats: {
            create: {},
          },
        },
        include: {
          userStats: true,
        },
      });

      // Generate tokens
      const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      // Store refresh token in Redis (7 days)
      await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Registration error', error);
      throw new ApiError(500, 'Failed to register user', 'REGISTRATION_ERROR');
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    // Find user
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (user.isBanned) {
      throw new ApiError(403, `Account banned: ${user.banReason}`, 'ACCOUNT_BANNED');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Store refresh token in Redis
    await redis.setex(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        rating: user.rating,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    try {
      const payload = verifyRefreshToken(refreshToken);

      // Verify token is stored in Redis
      const storedToken = await redis.get(`refresh_token:${payload.id}`);

      if (storedToken !== refreshToken) {
        throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        id: payload.id,
        email: payload.email,
        username: payload.username,
      });

      res.json({
        accessToken,
      });
    } catch (error) {
      logger.error('Token refresh error', error);
      throw new ApiError(401, 'Failed to refresh token', 'TOKEN_REFRESH_ERROR');
    }
  }

  async googleCallback(req: Request, _res: Response): Promise<void> {
    const { idToken } = req.body;

    if (!idToken) {
      throw new ApiError(400, 'ID token is required', 'MISSING_ID_TOKEN');
    }

    // TODO: Verify Google ID token and extract user info
    // For now, just return error
    throw new ApiError(501, 'Google OAuth implementation pending', 'NOT_IMPLEMENTED');
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const user = await this.userRepository.findById(req.user.id);

    if (!user) {
      throw new ApiError(404, 'User not found', 'NOT_FOUND');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        rating: user.rating,
        totalSubmissions: user.totalSubmissions,
        acceptedSubmissions: user.acceptedSubmissions,
      },
    });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    const { firstName, lastName, avatarUrl, bio } = req.body;

    const user = await this.userRepository.update(req.user.id, {
      firstName,
      lastName,
      avatarUrl,
      bio,
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
      },
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
    }

    // Delete refresh token from Redis
    await redis.del(`refresh_token:${req.user.id}`);

    res.json({
      message: 'Logout successful',
    });
  }
}
