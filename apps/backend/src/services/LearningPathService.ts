import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { Difficulty } from '@prisma/client';

export class LearningPathService {
  async generateLearningPath(userId: string): Promise<string> {
    try {
      const existingPath = await prisma.learningPath.findUnique({
        where: { userId },
      });

      if (existingPath) {
        return existingPath.id;
      }

      const userStats = await prisma.userStats.findUnique({
        where: { userId },
      });

      const currentLevel = this.determineCurrentLevel(userStats);

      const learningPath = await prisma.learningPath.create({
        data: {
          userId,
          currentLevel,
          nextRecommendedProblems: [],
          completedMilestones: [],
          totalProgress: 0,
          estimatedTimeToCompletion: 40,
        },
      });

      const problemIds = await this.generatePathProblems(currentLevel, 20);

      const nodes = await Promise.all(
        problemIds.map((problemId, index) =>
          prisma.learningPathNode.create({
            data: {
              learningPathId: learningPath.id,
              problemId,
              sequenceIndex: index,
              isCompleted: false,
            },
          })
        )
      );

      await prisma.learningPath.update({
        where: { id: learningPath.id },
        data: {
          nextRecommendedProblems: nodes.slice(0, 3).map((n) => n.problemId),
        },
      });

      logger.info(`Created learning path for user ${userId}`);

      return learningPath.id;
    } catch (error) {
      logger.error(`Error generating learning path for user ${userId}`, error);
      throw error;
    }
  }

  async getOrCreateLearningPath(userId: string) {
    let learningPath = await prisma.learningPath.findUnique({
      where: { userId },
      include: {
        nodes: {
          orderBy: { sequenceIndex: 'asc' },
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
              },
            },
          },
        },
      },
    });

    if (!learningPath) {
      await this.generateLearningPath(userId);
      learningPath = await prisma.learningPath.findUnique({
        where: { userId },
        include: {
          nodes: {
            orderBy: { sequenceIndex: 'asc' },
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                  difficulty: true,
                  tags: true,
                },
              },
            },
          },
        },
      });
    }

    return learningPath;
  }

  async updateLearningPathProgress(userId: string, problemId: string): Promise<void> {
    try {
      const learningPath = await prisma.learningPath.findUnique({
        where: { userId },
      });

      if (!learningPath) {
        throw new Error('Learning path not found');
      }

      const node = await prisma.learningPathNode.updateMany({
        where: {
          learningPathId: learningPath.id,
          problemId,
        },
        data: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      if (node.count > 0) {
        const totalNodes = await prisma.learningPathNode.count({
          where: { learningPathId: learningPath.id },
        });

        const completedNodes = await prisma.learningPathNode.count({
          where: {
            learningPathId: learningPath.id,
            isCompleted: true,
          },
        });

        const progress = Math.round((completedNodes / totalNodes) * 100);

        const nextNodes = await prisma.learningPathNode.findMany({
          where: {
            learningPathId: learningPath.id,
            isCompleted: false,
          },
          orderBy: { sequenceIndex: 'asc' },
          take: 3,
          select: { problemId: true },
        });

        const estimatedHours = Math.max(10, (100 - progress) / 5);

        await prisma.learningPath.update({
          where: { id: learningPath.id },
          data: {
            totalProgress: progress,
            nextRecommendedProblems: nextNodes.map((n) => n.problemId),
            estimatedTimeToCompletion: estimatedHours,
          },
        });

        logger.info(`Updated learning path progress for user ${userId}: ${progress}%`);
      }
    } catch (error) {
      logger.error(`Error updating learning path progress`, error);
      throw error;
    }
  }

  async getLearningPathProgress(userId: string) {
    const learningPath = await prisma.learningPath.findUnique({
      where: { userId },
      include: {
        nodes: {
          select: {
            isCompleted: true,
          },
        },
      },
    });

    if (!learningPath) {
      return null;
    }

    const totalNodes = learningPath.nodes.length;
    const completedNodes = learningPath.nodes.filter((n) => n.isCompleted).length;
    const progress = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    return {
      userId,
      currentLevel: learningPath.currentLevel,
      totalProgress: progress,
      completedProblems: completedNodes,
      totalProblems: totalNodes,
      nextRecommendedProblems: learningPath.nextRecommendedProblems,
      estimatedTimeToCompletion: learningPath.estimatedTimeToCompletion,
      completedMilestones: learningPath.completedMilestones,
    };
  }

  private determineCurrentLevel(userStats: any): Difficulty {
    if (!userStats) {
      return 'EASY';
    }

    const stats = userStats.problemsSolvedByDifficulty as Record<string, number>;

    if (stats.EASY === 0) return 'EASY';
    if (stats.EASY >= 10 && stats.MEDIUM < 3) return 'MEDIUM';
    if (stats.MEDIUM >= 5) return 'HARD';

    return 'EASY';
  }

  private async generatePathProblems(difficulty: Difficulty, limit: number): Promise<string[]> {
    const problems = await prisma.problem.findMany({
      where: {
        difficulty,
        isPublished: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        totalSubmissions: 'desc',
      },
      take: limit,
    });

    return problems.map((p) => p.id);
  }
}

export const learningPathService = new LearningPathService();
