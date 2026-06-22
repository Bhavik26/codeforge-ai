import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { ApiError } from './error-handler.middleware';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (!user) {
        throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
      }

      if (!allowedRoles.includes(user.role)) {
        throw new ApiError(
          403,
          'Insufficient permissions to access this resource',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
      return;
    }
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireProblemSetter = requireRole(['ADMIN', 'PROBLEM_SETTER']);
export const requireModerator = requireRole(['ADMIN', 'MODERATOR']);
