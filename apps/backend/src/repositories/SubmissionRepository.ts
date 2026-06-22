import { prisma } from '../config/database';
import { BaseRepository } from './BaseRepository';
import { Submission, SubmissionStatus, SubmissionVerdict } from '@prisma/client';

export class SubmissionRepository extends BaseRepository<Submission> {
  constructor() {
    super(prisma.submission);
  }

  async createSubmission(data: {
    userId: string;
    problemId: string;
    code: string;
    language: string;
  }): Promise<Submission> {
    return prisma.submission.create({
      data: {
        userId: data.userId,
        problemId: data.problemId,
        code: data.code,
        language: data.language,
        status: SubmissionStatus.PENDING,
        verdict: SubmissionVerdict.PENDING,
      },
    });
  }

  async getSubmissionsByUserId(
    userId: string,
    skip: number = 0,
    take: number = 20
  ): Promise<{ submissions: Submission[]; total: number }> {
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
            },
          },
        },
      }),
      prisma.submission.count({ where: { userId } }),
    ]);

    return { submissions: submissions as Submission[], total };
  }

  async getSubmissionsByProblemId(
    problemId: string,
    skip: number = 0,
    take: number = 20
  ): Promise<{ submissions: Submission[]; total: number }> {
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { problemId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.submission.count({ where: { problemId } }),
    ]);

    return { submissions: submissions as Submission[], total };
  }

  async getLatestSubmissionByUserAndProblem(
    userId: string,
    problemId: string
  ): Promise<Submission | null> {
    return prisma.submission.findFirst({
      where: {
        userId,
        problemId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
    verdict?: SubmissionVerdict
  ): Promise<Submission> {
    return prisma.submission.update({
      where: { id },
      data: {
        status,
        ...(verdict && { verdict }),
      },
    });
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
  ): Promise<Submission> {
    return prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        verdict: data.verdict,
        executionTime: data.executionTime,
        memoryUsed: data.memoryUsed,
        score: data.score,
        totalTestCases: data.totalTestCases,
        passedTestCases: data.passedTestCases,
        compilationError: data.compilationError,
        runtimeError: data.runtimeError,
        updatedAt: new Date(),
      },
    });
  }

  async getSubmissionWithResults(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            timeLimit: true,
            memoryLimit: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        results: {
          include: {
            testCase: {
              select: {
                id: true,
                isHidden: true,
                isExample: true,
              },
            },
          },
        },
      },
    });
  }

  async getSubmissionsByStatus(
    status: SubmissionStatus,
    skip: number = 0,
    take: number = 20
  ): Promise<{ submissions: Submission[]; total: number }> {
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { status },
        skip,
        take,
        orderBy: { createdAt: 'asc' },
      }),
      prisma.submission.count({ where: { status } }),
    ]);

    return { submissions, total };
  }

  async getAcceptedSubmissionsByUser(userId: string): Promise<number> {
    return prisma.submission.count({
      where: {
        userId,
        verdict: SubmissionVerdict.ACCEPTED,
      },
    });
  }

  async getTotalSubmissionsByUser(userId: string): Promise<number> {
    return prisma.submission.count({
      where: { userId },
    });
  }

  async deleteSubmission(id: string): Promise<void> {
    await prisma.submission.delete({
      where: { id },
    });
  }

  async getRecentSubmissions(limit: number = 10): Promise<Submission[]> {
    return prisma.submission.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }
}
