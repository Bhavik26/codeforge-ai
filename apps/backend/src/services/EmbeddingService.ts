import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { logger } from '../config/logger';

export class EmbeddingService {
  async generateProblemEmbedding(problemId: string): Promise<void> {
    try {
      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          tags: true,
        },
      });

      if (!problem) {
        throw new Error(`Problem ${problemId} not found`);
      }

      const textToEmbed = `${problem.title} ${problem.description} ${problem.tags.join(' ')}`.substring(0, 8000);
      const embedding = await openaiService.generateEmbedding(textToEmbed);

      await prisma.problemEmbedding.upsert({
        where: { problemId },
        create: {
          problemId,
          embedding,
          difficulty: problem.difficulty,
          tags: problem.tags,
        },
        update: {
          embedding,
          tags: problem.tags,
        },
      });

      logger.info(`Generated embedding for problem ${problemId}`);
    } catch (error) {
      logger.error(`Error generating embedding for problem ${problemId}`, error);
      throw error;
    }
  }

  async generateUserPreferenceEmbedding(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const solvedProblems = await prisma.submission.findMany({
        where: {
          userId,
          verdict: 'ACCEPTED',
        },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              tags: true,
              difficulty: true,
            },
          },
        },
        take: 50,
      });

      if (solvedProblems.length === 0) {
        logger.info(`No solved problems for user ${userId}, skipping preference embedding`);
        return;
      }

      const preferenceText = solvedProblems
        .map((s) => `${s.problem.title} ${s.problem.tags.join(' ')} ${s.problem.difficulty}`)
        .join(' ')
        .substring(0, 8000);

      const embedding = await openaiService.generateEmbedding(preferenceText);

      await prisma.userPreferenceEmbedding.upsert({
        where: { userId },
        create: {
          userId,
          embedding,
        },
        update: {
          embedding,
        },
      });

      logger.info(`Generated preference embedding for user ${userId}`);
    } catch (error) {
      logger.error(`Error generating preference embedding for user ${userId}`, error);
      throw error;
    }
  }

  async findSimilarProblems(problemId: string, limit: number = 10): Promise<string[]> {
    try {
      const sourceEmbedding = await prisma.problemEmbedding.findUnique({
        where: { problemId },
        select: { embedding: true },
      });

      if (!sourceEmbedding) {
        throw new Error(`Embedding not found for problem ${problemId}`);
      }

      const similarProblems = await prisma.problemEmbedding.findMany({
        where: {
          NOT: {
            problemId,
          },
        },
        select: {
          problemId: true,
          embedding: true,
        },
        take: limit * 2,
      });

      const scored = similarProblems.map((p) => ({
        problemId: p.problemId,
        similarity: this.cosineSimilarity(sourceEmbedding.embedding, p.embedding),
      }));

      const sorted = scored.sort((a, b) => b.similarity - a.similarity);

      return sorted.slice(0, limit).map((p) => p.problemId);
    } catch (error) {
      logger.error(`Error finding similar problems for ${problemId}`, error);
      throw error;
    }
  }

  async recommendProblems(userId: string, limit: number = 10): Promise<string[]> {
    try {
      const userEmbedding = await prisma.userPreferenceEmbedding.findUnique({
        where: { userId },
        select: { embedding: true },
      });

      if (!userEmbedding) {
        logger.info(`No preference embedding for user ${userId}, using difficulty-based recommendation`);
        return this.recommendByDifficulty(userId, limit);
      }

      const solvedProblems = await prisma.submission.findMany({
        where: {
          userId,
          verdict: 'ACCEPTED',
        },
        select: {
          problemId: true,
        },
      });

      const solvedIds = new Set(solvedProblems.map((s) => s.problemId));

      const allProblems = await prisma.problemEmbedding.findMany({
        where: {
          problem: {
            isPublished: true,
          },
          NOT: {
            problemId: {
              in: Array.from(solvedIds),
            },
          },
        },
        select: {
          problemId: true,
          embedding: true,
        },
        take: limit * 5,
      });

      const scored = allProblems.map((p) => ({
        problemId: p.problemId,
        similarity: this.cosineSimilarity(userEmbedding.embedding, p.embedding),
      }));

      const sorted = scored.sort((a, b) => b.similarity - a.similarity);

      return sorted.slice(0, limit).map((p) => p.problemId);
    } catch (error) {
      logger.error(`Error recommending problems for user ${userId}`, error);
      throw error;
    }
  }

  private async recommendByDifficulty(userId: string, limit: number): Promise<string[]> {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { problemsSolvedByDifficulty: true },
    });

    if (!userStats) {
      return [];
    }

    const stats = userStats.problemsSolvedByDifficulty as Record<string, number>;

    let targetDifficulty = 'EASY';

    if (stats.EASY >= 5) targetDifficulty = 'MEDIUM';
    if (stats.MEDIUM >= 5) targetDifficulty = 'HARD';

    const problems = await prisma.problem.findMany({
      where: {
        difficulty: targetDifficulty as any,
        isPublished: true,
      },
      select: {
        id: true,
      },
      take: limit,
      orderBy: {
        totalSubmissions: 'desc',
      },
    });

    return problems.map((p) => p.id);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

export const embeddingService = new EmbeddingService();
