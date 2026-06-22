import { Job } from 'bullmq';
import { Queue, JobData } from './Queue';
import { codeReviewAIService } from '../services/CodeReviewAIService';
import { embeddingService } from '../services/EmbeddingService';
import { recommendationEngine } from '../services/RecommendationEngine';
import { contestAnalyticsService } from '../services/ContestAnalyticsService';
import { logger } from '../config/logger';

export interface AnalysisJobData extends JobData {
  type: 'GENERATE_CODE_REVIEW' | 'UPDATE_USER_PROFILE_EMBEDDING' | 'GENERATE_PROBLEM_EMBEDDING' | 'ANALYZE_CONTEST_PERFORMANCE';
  submissionId?: string;
  userId?: string;
  problemId?: string;
  contestId?: string;
}

export class AnalysisQueue extends Queue<AnalysisJobData> {
  constructor() {
    super('analysis-queue');
  }

  protected async processJob(job: Job<AnalysisJobData>): Promise<any> {
    const { type, submissionId, userId, problemId, contestId } = job.data;
    logger.info(`Processing analysis job ${job.id} of type ${type}`);

    try {
      switch (type) {
        case 'GENERATE_CODE_REVIEW':
          if (!submissionId) throw new Error('submissionId is required for GENERATE_CODE_REVIEW');
          await codeReviewAIService.reviewSubmissionCode(submissionId);
          return { status: 'completed', submissionId };

        case 'UPDATE_USER_PROFILE_EMBEDDING':
          if (!userId) throw new Error('userId is required for UPDATE_USER_PROFILE_EMBEDDING');
          await embeddingService.generateUserPreferenceEmbedding(userId);
          await recommendationEngine.updateSkillGraph(userId);
          return { status: 'completed', userId };

        case 'GENERATE_PROBLEM_EMBEDDING':
          if (!problemId) throw new Error('problemId is required for GENERATE_PROBLEM_EMBEDDING');
          await embeddingService.generateProblemEmbedding(problemId);
          return { status: 'completed', problemId };

        case 'ANALYZE_CONTEST_PERFORMANCE':
          if (!contestId || !userId) throw new Error('contestId and userId are required for ANALYZE_CONTEST_PERFORMANCE');
          await contestAnalyticsService.analyzeContestPerformance(contestId, userId);
          return { status: 'completed', contestId, userId };

        default:
          throw new Error(`Unsupported job type: ${type}`);
      }
    } catch (error) {
      logger.error(`Error processing analysis job ${job.id} of type ${type}`, error);
      throw error;
    }
  }

  async addCodeReviewJob(submissionId: string) {
    return this.addJob({
      type: 'GENERATE_CODE_REVIEW',
      submissionId,
    }, { priority: 10 });
  }

  async addUserProfileEmbeddingJob(userId: string) {
    return this.addJob({
      type: 'UPDATE_USER_PROFILE_EMBEDDING',
      userId,
    }, { priority: 2 });
  }

  async addProblemEmbeddingJob(problemId: string) {
    return this.addJob({
      type: 'GENERATE_PROBLEM_EMBEDDING',
      problemId,
    }, { priority: 5 });
  }

  async addContestAnalyticsJob(contestId: string, userId: string) {
    return this.addJob({
      type: 'ANALYZE_CONTEST_PERFORMANCE',
      contestId,
      userId,
    }, { priority: 3 });
  }
}

export const analysisQueue = new AnalysisQueue();
