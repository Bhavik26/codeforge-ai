import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { config } from '../../config/env';
import { logger } from '../../config/logger';

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate-limit:${ip}`;
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequests;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    res.set('X-RateLimit-Limit', maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());

    if (current > maxRequests) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000),
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Rate limiter error', error);
    // If Redis fails, allow the request but log it
    next();
  }
};
