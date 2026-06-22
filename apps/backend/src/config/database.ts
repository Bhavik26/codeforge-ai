import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

// Log database events
if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 1000) {
      logger.warn(`Slow query: ${e.query} (${e.duration}ms)`);
    }
  });

  (prisma as any).$on('error', (e: any) => {
    logger.error('Prisma error:', e.message);
  });

  (prisma as any).$on('warn', (e: any) => {
    logger.warn('Prisma warning:', e.message);
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
