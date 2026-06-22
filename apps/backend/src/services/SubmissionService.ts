import { SubmissionRepository } from '../repositories/SubmissionRepository';
import { ProblemRepository } from '../repositories/ProblemRepository';
import { CreateSubmissionInput } from '../schemas/submission.schema';
import { prisma } from '../config/database';
import { SubmissionStatus, SubmissionVerdict } from '@prisma/client';

export interface JudgeJobData {
  submissionId: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  timeLimit: number;
  memoryLimit: number;
}

export class SubmissionService {
  private submissionRepository: SubmissionRepository;
  private problemRepository: ProblemRepository;
  private judgeQueue: any;

  constructor(judgeQueue?: any) {
    this.submissionRepository = new SubmissionRepository();
    this.problemRepository = new ProblemRepository();
    this.judgeQueue = judgeQueue;
  }

  async createSubmission(userId: string, input: CreateSubmissionInput) {
    const problem = await this.problemRepository.findById(input.problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    if (!problem.isPublished) {
      throw new Error('Problem is not published');
    }

    const submission = await this.submissionRepository.createSubmission({
      userId,
      problemId: input.problemId,
      code: input.code,
      language: input.language,
    });

    const jobData: JudgeJobData = {
      submissionId: submission.id,
      userId,
      problemId: input.problemId,
      code: input.code,
      language: input.language,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    };

    if (this.judgeQueue) {
      await this.judgeQueue.addJob(jobData, {
        priority: 5,
        attempts: 1,
      });
    }

    return submission;
  }

  async getSubmissionById(id: string) {
    const submission = await this.submissionRepository.getSubmissionWithResults(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  }

  async getSubmissionsByUserId(userId: string, skip: number = 0, take: number = 20) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.submissionRepository.getSubmissionsByUserId(userId, skip, take);
  }

  async getSubmissionsByProblemId(problemId: string, skip: number = 0, take: number = 20) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.submissionRepository.getSubmissionsByProblemId(problemId, skip, take);
  }

  async getLatestSubmissionByUserAndProblem(userId: string, problemId: string) {
    return this.submissionRepository.getLatestSubmissionByUserAndProblem(userId, problemId);
  }

  async updateSubmissionResults(
    id: string,
    data: {
      status: SubmissionStatus;
      verdict: SubmissionVerdict;
      executionTime?: number;
      memoryUsed?: number;
      score?: number;
      totalTestCases?: number;
      passedTestCases?: number;
      compilationError?: string;
      runtimeError?: string;
    }
  ) {
    return this.submissionRepository.updateSubmissionResults(id, data);
  }

  async getAcceptedSubmissionsByUser(userId: string): Promise<number> {
    return this.submissionRepository.getAcceptedSubmissionsByUser(userId);
  }

  async getTotalSubmissionsByUser(userId: string): Promise<number> {
    return this.submissionRepository.getTotalSubmissionsByUser(userId);
  }

  async getSubmissionStats(userId: string) {
    const [accepted, total] = await Promise.all([
      this.submissionRepository.getAcceptedSubmissionsByUser(userId),
      this.submissionRepository.getTotalSubmissionsByUser(userId),
    ]);

    return {
      userId,
      acceptedSubmissions: accepted,
      totalSubmissions: total,
      successRate: total > 0 ? ((accepted / total) * 100).toFixed(2) : 0,
    };
  }

  async getRecentSubmissions(limit: number = 10) {
    return this.submissionRepository.getRecentSubmissions(limit);
  }

  async deleteSubmission(id: string) {
    const submission = await this.submissionRepository.findById(id);
    if (!submission) {
      throw new Error('Submission not found');
    }

    await this.submissionRepository.deleteSubmission(id);
  }
}
