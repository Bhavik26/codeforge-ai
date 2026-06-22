import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { logger } from '../config/logger';

export class CodeReviewAIService {
  async reviewSubmissionCode(submissionId: string): Promise<void> {
    try {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      logger.info(`Starting AI code review for submission ${submissionId}`);

      const reviewAnalysis = await openaiService.analyzeCodeForReview({
        code: submission.code,
        language: submission.language,
        problemDescription: submission.problem.description,
      });

      const existingReview = await prisma.codeReview.findUnique({
        where: { submissionId },
      });

      let codeReview;

      if (existingReview) {
        codeReview = await prisma.codeReview.update({
          where: { submissionId },
          data: {
            overallScore: reviewAnalysis.overallScore,
            readabilityScore: reviewAnalysis.readabilityScore,
            efficiencyScore: reviewAnalysis.efficiencyScore,
            maintenabilityScore: reviewAnalysis.maintenabilityScore,
            feedback: reviewAnalysis.summary,
            improvements: reviewAnalysis.keyTakeaways,
            complexityAnalysis: {
              timeComplexity: reviewAnalysis.timeComplexity,
              spaceComplexity: reviewAnalysis.spaceComplexity,
            },
            codeSmells: [],
            suggestions: JSON.stringify(reviewAnalysis.optimizations),
          },
        });
      } else {
        codeReview = await prisma.codeReview.create({
          data: {
            submissionId,
            userId: submission.user.id,
            reviewType: 'AI',
            overallScore: reviewAnalysis.overallScore,
            readabilityScore: reviewAnalysis.readabilityScore,
            efficiencyScore: reviewAnalysis.efficiencyScore,
            maintenabilityScore: reviewAnalysis.maintenabilityScore,
            feedback: reviewAnalysis.summary,
            improvements: reviewAnalysis.keyTakeaways,
            complexityAnalysis: {
              timeComplexity: reviewAnalysis.timeComplexity,
              spaceComplexity: reviewAnalysis.spaceComplexity,
            },
            codeSmells: [],
            suggestions: JSON.stringify(reviewAnalysis.optimizations),
          },
        });
      }

      await prisma.codeReviewAnalysis.upsert({
        where: { codeReviewId: codeReview.id },
        create: {
          codeReviewId: codeReview.id,
          timeComplexity: reviewAnalysis.timeComplexity,
          timeComplexityExplanation: reviewAnalysis.timeComplexityExplanation,
          spaceComplexity: reviewAnalysis.spaceComplexity,
          spaceComplexityExplanation: reviewAnalysis.spaceComplexityExplanation,
          optimizations: JSON.stringify(reviewAnalysis.optimizations),
          bugs: JSON.stringify(reviewAnalysis.bugs),
          readabilityScore: reviewAnalysis.readabilityScore,
          efficiencyScore: reviewAnalysis.efficiencyScore,
          maintenabilityScore: reviewAnalysis.maintenabilityScore,
          overallScore: reviewAnalysis.overallScore,
          summary: reviewAnalysis.summary,
          keyTakeaways: reviewAnalysis.keyTakeaways,
        },
        update: {
          timeComplexity: reviewAnalysis.timeComplexity,
          timeComplexityExplanation: reviewAnalysis.timeComplexityExplanation,
          spaceComplexity: reviewAnalysis.spaceComplexity,
          spaceComplexityExplanation: reviewAnalysis.spaceComplexityExplanation,
          optimizations: JSON.stringify(reviewAnalysis.optimizations),
          bugs: JSON.stringify(reviewAnalysis.bugs),
          readabilityScore: reviewAnalysis.readabilityScore,
          efficiencyScore: reviewAnalysis.efficiencyScore,
          maintenabilityScore: reviewAnalysis.maintenabilityScore,
          overallScore: reviewAnalysis.overallScore,
          summary: reviewAnalysis.summary,
          keyTakeaways: reviewAnalysis.keyTakeaways,
        },
      });

      logger.info(`Code review completed for submission ${submissionId}`);
    } catch (error) {
      logger.error(`Error reviewing submission ${submissionId}`, error);
      throw error;
    }
  }

  async getCodeReviewAnalysis(submissionId: string) {
    const codeReview = await prisma.codeReview.findUnique({
      where: { submissionId },
      include: {
        analysis: true,
      },
    });

    if (!codeReview) {
      throw new Error('Code review not found');
    }

    return codeReview;
  }

  async getUserCodeReviewStats(userId: string) {
    const reviews = await prisma.codeReview.findMany({
      where: { userId },
      select: {
        overallScore: true,
        readabilityScore: true,
        efficiencyScore: true,
        maintenabilityScore: true,
      },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageScore: 0,
        averageReadability: 0,
        averageEfficiency: 0,
        averageMaintainability: 0,
      };
    }

    const totalScore = reviews.reduce((sum, r) => sum + (r.overallScore || 0), 0);
    const totalReadability = reviews.reduce((sum, r) => sum + (r.readabilityScore || 0), 0);
    const totalEfficiency = reviews.reduce((sum, r) => sum + (r.efficiencyScore || 0), 0);
    const totalMaintainability = reviews.reduce((sum, r) => sum + (r.maintenabilityScore || 0), 0);

    return {
      totalReviews: reviews.length,
      averageScore: Math.round(totalScore / reviews.length),
      averageReadability: Math.round(totalReadability / reviews.length),
      averageEfficiency: Math.round(totalEfficiency / reviews.length),
      averageMaintainability: Math.round(totalMaintainability / reviews.length),
    };
  }
}

export const codeReviewAIService = new CodeReviewAIService();
