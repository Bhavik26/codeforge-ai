import { prisma } from '../config/database';
import { BaseRepository } from './BaseRepository';
import type { User } from '@prisma/client';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        userStats: true,
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
      include: {
        userStats: true,
      },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId },
      include: {
        userStats: true,
      },
    });
  }

  async findTopRatedUsers(limit: number = 100): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        isBanned: false,
      },
      orderBy: {
        rating: 'desc',
      },
      take: limit,
      include: {
        userStats: true,
      },
    });
  }

  async findByRatingRange(minRating: number, maxRating: number): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        rating: {
          gte: minRating,
          lte: maxRating,
        },
        isBanned: false,
      },
      orderBy: {
        rating: 'desc',
      },
      include: {
        userStats: true,
      },
    });
  }

  async incrementTotalSubmissions(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalSubmissions: {
          increment: 1,
        },
      },
    });
  }

  async incrementAcceptedSubmissions(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        acceptedSubmissions: {
          increment: 1,
        },
      },
    });
  }

  async updateRating(userId: string, newRating: number): Promise<User> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const history = typeof user.ratingHistory === 'string'
      ? JSON.parse(user.ratingHistory)
      : user.ratingHistory || [];

    history.push({
      rating: newRating,
      timestamp: new Date(),
      change: newRating - user.rating,
    });

    return prisma.user.update({
      where: { id: userId },
      data: {
        rating: newRating,
        ratingHistory: JSON.stringify(history),
      },
    });
  }

  async banUser(userId: string, reason: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: reason,
      },
    });
  }

  async unbanUser(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: false,
        banReason: null,
      },
    });
  }
}
