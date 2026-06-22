import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { embeddingService } from './EmbeddingService';
import { logger } from '../config/logger';

export class RecommendationEngine {
  async analyzeWeakAreas(userId: string): Promise<string[]> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { userId },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              tags: true,
            },
          },
        },
      });

      const accepted = submissions
        .filter((s) => s.verdict === 'ACCEPTED')
        .map((s) => s.problem.title);

      const failed = submissions
        .filter((s) => s.verdict !== 'ACCEPTED')
        .map((s) => s.problem.title);

      if (failed.length === 0) {
        logger.info(`User ${userId} has no failed attempts`);
        return [];
      }

      const weakTopics = await openaiService.generateWeakTopicAnalysis(accepted, failed);

      await prisma.userSkillGraph.upsert({
        where: { userId },
        create: {
          userId,
          weakTopics,
          strongTopics: [],
        },
        update: {
          weakTopics,
        },
      });

      logger.info(`Analyzed weak areas for user ${userId}:`, weakTopics);

      return weakTopics;
    } catch (error) {
      logger.error(`Error analyzing weak areas for user ${userId}`, error);
      throw error;
    }
  }

  async generatePersonalizedRecommendations(userId: string, limit: number = 10): Promise<string[]> {
    try {
      logger.info(`Generating recommendations for user ${userId}`);

      return await embeddingService.recommendProblems(userId, limit);
    } catch (error) {
      logger.error(`Error generating recommendations for user ${userId}`, error);
      throw error;
    }
  }

  async generateLearningPath(userId: string): Promise<string[]> {
    try {
      const weakAreas = await this.analyzeWeakAreas(userId);

      if (weakAreas.length === 0) {
        logger.info(`No weak areas for user ${userId}, generating default path`);
        return [];
      }

      const submissions = await prisma.submission.findMany({
        where: { userId },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      const solvedProblems = submissions
        .filter((s) => s.verdict === 'ACCEPTED')
        .map((s) => s.problem.title);

      const recommendations = await openaiService.generateLearningPathRecommendations(
        userId,
        solvedProblems,
        weakAreas
      );

      const skillGraph = await prisma.userSkillGraph.findUnique({
        where: { userId },
      });

      if (skillGraph) {
        await prisma.userSkillGraph.update({
          where: { userId },
          data: {
            improvementEstimate: Math.max(10, weakAreas.length * 5),
          },
        });
      }

      logger.info(`Generated learning path recommendations for user ${userId}`);

      return recommendations;
    } catch (error) {
      logger.error(`Error generating learning path for user ${userId}`, error);
      throw error;
    }
  }

  async getRecommendedProblems(userId: string, limit: number = 10) {
    try {
      const recommendedProblemIds = await this.generatePersonalizedRecommendations(userId, limit);

      const problems = await prisma.problem.findMany({
        where: {
          id: {
            in: recommendedProblemIds,
          },
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          totalSubmissions: true,
          successRate: true,
        },
      });

      for (const problemId of recommendedProblemIds) {
        await prisma.userRecommendation.upsert({
          where: {
            userId_problemId: {
              userId,
              problemId,
            },
          },
          create: {
            userId,
            problemId,
            reason: 'PERSONALIZED',
            similarityScore: 0.8,
          },
          update: {
            reason: 'PERSONALIZED',
            similarityScore: 0.8,
          },
        });
      }

      return problems;
    } catch (error) {
      logger.error(`Error fetching recommended problems for user ${userId}`, error);
      throw error;
    }
  }

  async getUserSkillGraph(userId: string) {
    const skillGraph = await prisma.userSkillGraph.findUnique({
      where: { userId },
    });

    if (!skillGraph) {
      return null;
    }

    const skillNodes = JSON.parse(
      typeof skillGraph.skillNodes === 'string' ? skillGraph.skillNodes : JSON.stringify(skillGraph.skillNodes)
    );

    return {
      userId,
      skillNodes,
      weakTopics: skillGraph.weakTopics,
      strongTopics: skillGraph.strongTopics,
      improvementEstimate: skillGraph.improvementEstimate,
    };
  }

  async updateSkillGraph(userId: string): Promise<void> {
    try {
      const submissions = await prisma.submission.findMany({
        where: { userId },
        include: {
          problem: {
            select: {
              id: true,
              tags: true,
              difficulty: true,
            },
          },
        },
      });

      const skillNodes: Record<
        string,
        {
          skillId: string;
          name: string;
          proficiency: number;
          lastUpdated: string;
        }
      > = {};

      const tagCounts: Record<string, { solved: number; total: number }> = {};

      for (const submission of submissions) {
        for (const tag of submission.problem.tags) {
          if (!tagCounts[tag]) {
            tagCounts[tag] = { solved: 0, total: 0 };
          }
          tagCounts[tag].total++;

          if (submission.verdict === 'ACCEPTED') {
            tagCounts[tag].solved++;
          }
        }
      }

      for (const [tag, counts] of Object.entries(tagCounts)) {
        const proficiency = counts.total > 0 ? Math.round((counts.solved / counts.total) * 100) : 0;
        skillNodes[tag] = {
          skillId: tag,
          name: tag,
          proficiency,
          lastUpdated: new Date().toISOString(),
        };
      }

      const strongTopics = Object.entries(skillNodes)
        .filter(([, node]) => node.proficiency >= 70)
        .map(([name]) => name);

      const weakTopics = Object.entries(skillNodes)
        .filter(([, node]) => node.proficiency < 50)
        .map(([name]) => name);

      await prisma.userSkillGraph.upsert({
        where: { userId },
        create: {
          userId,
          skillNodes: JSON.stringify(Object.values(skillNodes)),
          strongTopics,
          weakTopics,
        },
        update: {
          skillNodes: JSON.stringify(Object.values(skillNodes)),
          strongTopics,
          weakTopics,
        },
      });

      logger.info(`Updated skill graph for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating skill graph for user ${userId}`, error);
      throw error;
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
