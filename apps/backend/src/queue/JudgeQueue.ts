import { Job } from 'bullmq';
import { logger } from '../config/logger';
import { Queue } from './Queue';
import { SubmissionService, JudgeJobData } from '../services/SubmissionService';

export class JudgeQueue extends Queue<JudgeJobData> {
  constructor() {
    super('judge-queue');
  }

  protected async processJob(job: Job<JudgeJobData>): Promise<any> {
    try {
      logger.info(`Processing judge job: ${job.id} for submission ${job.data.submissionId}`);

      const submissionService = new SubmissionService();
      const submission = await submissionService.getSubmissionById(job.data.submissionId);

      if (!submission) {
        throw new Error(`Submission ${job.data.submissionId} not found`);
      }

      await submissionService.updateSubmissionResults(job.data.submissionId, {
        status: 'COMPILING',
        verdict: 'PENDING',
      });

      return {
        submissionId: job.data.submissionId,
        status: 'queued',
        message: 'Submission queued for judgment',
      };
    } catch (error) {
      logger.error(`Error processing judge job ${job.id}`, error);
      throw error;
    }
  }

  async addSubmissionJob(
    submissionId: string,
    userId: string,
    problemId: string,
    code: string,
    language: string,
    timeLimit: number,
    memoryLimit: number
  ): Promise<Job<JudgeJobData>> {
    const jobData: JudgeJobData = {
      submissionId,
      userId,
      problemId,
      code,
      language,
      timeLimit,
      memoryLimit,
    };

    return this.addJob(jobData, {
      priority: 5,
      attempts: 1,
    });
  }
}

export const judgeQueue = new JudgeQueue();
