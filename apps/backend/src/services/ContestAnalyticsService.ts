import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { logger } from '../config/logger';

export class ContestAnalyticsService {
  async analyzeContestPerformance(contestId: string, userId: string): Promise<void> {
    try {
      const submissions = await prisma.contestSubmission.findMany({
        where: {
          contestId,
          submission: {
            userId,
          },
        },
        include: {
          submission: {
            include: {
              problem: {
                select: {
                  id: true,
                  title: true,
                },
              },
              results: true,
            },
          },
        },
      });

      if (submissions.length === 0) {
        logger.info(`No submissions for user ${userId} in contest ${contestId}`);
        return;
      }

      const leaderboardEntry = await prisma.leaderboard.findUnique({
        where: {
          contestId_userId: {
            contestId,
            userId,
          },
        },
      });

      const problemAnalytics: Record<
        string,
        {
          attempts: number;
          time: number;
          verdict: string;
        }
      > = {};

      let totalAttempts = 0;
      let correctSubmissions = 0;
      let firstAcceptTime: number | null = null;
      let totalTime = 0;

      for (const submission of submissions) {
        const problemId = submission.submission.problem.id;

        if (!problemAnalytics[problemId]) {
          problemAnalytics[problemId] = {
            attempts: 0,
            time: 0,
            verdict: 'WRONG_ANSWER',
          };
        }

        problemAnalytics[problemId].attempts++;
        totalAttempts++;

        if (submission.submission.verdict === 'ACCEPTED') {
          problemAnalytics[problemId].verdict = 'ACCEPTED';
          correctSubmissions++;

          if (firstAcceptTime === null) {
            const timeDiff =
              submission.submission.createdAt.getTime() - new Date(submissions[0].submission.createdAt).getTime();
            firstAcceptTime = Math.round(timeDiff / 60000);
          }
        }

        if (submission.submission.executionTime) {
          totalTime += submission.submission.executionTime;
        }
      }

      const performanceData = Object.entries(problemAnalytics).map(([problemId, data]) => ({
        name: submissions.find((s) => s.submission.problem.id === problemId)?.submission.problem.title || problemId,
        attempts: data.attempts,
        time: data.time,
        verdict: data.verdict,
      }));

      const analysisResult = await openaiService.analyzeContestPerformance(performanceData);

      await prisma.contestAnalytics.upsert({
        where: {
          contestId_userId: {
            contestId,
            userId,
          },
        },
        create: {
          contestId,
          userId,
          finalRank: leaderboardEntry?.rank || 0,
          finalScore: leaderboardEntry?.score || 0,
          problemsSolved: correctSubmissions,
          wrongSubmissions: totalAttempts - correctSubmissions,
          totalAttempts,
          firstAcceptTime,
          averageProblemTime: totalAttempts > 0 ? totalTime / totalAttempts / 1000 : 0,
          problemAnalytics: JSON.stringify(problemAnalytics),
          strengths: analysisResult.strengths,
          weaknesses: analysisResult.weaknesses,
          recommendations: analysisResult.recommendations,
        },
        update: {
          finalRank: leaderboardEntry?.rank || 0,
          finalScore: leaderboardEntry?.score || 0,
          problemsSolved: correctSubmissions,
          wrongSubmissions: totalAttempts - correctSubmissions,
          totalAttempts,
          firstAcceptTime,
          averageProblemTime: totalAttempts > 0 ? totalTime / totalAttempts / 1000 : 0,
          problemAnalytics: JSON.stringify(problemAnalytics),
          strengths: analysisResult.strengths,
          weaknesses: analysisResult.weaknesses,
          recommendations: analysisResult.recommendations,
        },
      });

      logger.info(`Analyzed contest performance for user ${userId} in contest ${contestId}`);
    } catch (error) {
      logger.error(`Error analyzing contest performance`, error);
      throw error;
    }
  }

  async getContestAnalytics(contestId: string, userId: string) {
    const analytics = await prisma.contestAnalytics.findUnique({
      where: {
        contestId_userId: {
          contestId,
          userId,
        },
      },
    });

    if (!analytics) {
      throw new Error('Contest analytics not found');
    }

    return {
      contestId,
      userId,
      finalRank: analytics.finalRank,
      finalScore: analytics.finalScore,
      problemsSolved: analytics.problemsSolved,
      wrongSubmissions: analytics.wrongSubmissions,
      totalAttempts: analytics.totalAttempts,
      firstAcceptTime: analytics.firstAcceptTime,
      averageProblemTime: analytics.averageProblemTime,
      problemAnalytics: JSON.parse(
        typeof analytics.problemAnalytics === 'string'
          ? analytics.problemAnalytics
          : JSON.stringify(analytics.problemAnalytics)
      ),
      strengths: analytics.strengths,
      weaknesses: analytics.weaknesses,
      recommendations: analytics.recommendations,
    };
  }

  async getUserContestHistory(userId: string, skip: number = 0, take: number = 20) {
    const [analytics, total] = await Promise.all([
      prisma.contestAnalytics.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { analyzedAt: 'desc' },
        include: {
          contest: {
            select: {
              id: true,
              title: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.contestAnalytics.count({ where: { userId } }),
    ]);

    return { analytics, total };
  }

  async getContestStatistics(userId: string) {
    const contests = await prisma.contestAnalytics.findMany({
      where: { userId },
      select: {
        finalRank: true,
        finalScore: true,
        problemsSolved: true,
        totalAttempts: true,
      },
    });

    if (contests.length === 0) {
      return {
        totalContests: 0,
        averageRank: 0,
        averageScore: 0,
        totalProblemsSolved: 0,
        averageAccuracy: 0,
      };
    }

    const totalScore = contests.reduce((sum, c) => sum + c.finalScore, 0);
    const totalRank = contests.reduce((sum, c) => sum + c.finalRank, 0);
    const totalProblems = contests.reduce((sum, c) => sum + c.problemsSolved, 0);
    const totalAttempts = contests.reduce((sum, c) => sum + c.totalAttempts, 0);

    return {
      totalContests: contests.length,
      averageRank: Math.round(totalRank / contests.length),
      averageScore: Math.round(totalScore / contests.length),
      totalProblemsSolved: totalProblems,
      averageAccuracy: totalAttempts > 0 ? ((totalProblems / totalAttempts) * 100).toFixed(2) : 0,
    };
  }
}

export const contestAnalyticsService = new ContestAnalyticsService();
