import { prisma } from '../config/database';
import { BaseRepository } from './BaseRepository';
import { Problem, Difficulty } from '@prisma/client';

export interface ProblemFilter {
  difficulty?: Difficulty;
  tags?: string[];
  search?: string;
  isPublished?: boolean;
  isPremium?: boolean;
  sortBy?: 'recent' | 'popular' | 'trending' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

export class ProblemRepository extends BaseRepository<Problem> {
  constructor() {
    super(prisma.problem);
  }

  async findBySlug(slug: string): Promise<Problem | null> {
    return prisma.problem.findUnique({
      where: { slug },
    });
  }

  async createProblem(data: {
    title: string;
    slug: string;
    description: string;
    difficulty: Difficulty;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    editorial?: string;
    exampleInput?: string;
    exampleOutput?: string;
    isPublished?: boolean;
    isPremium?: boolean;
  }): Promise<Problem> {
    return prisma.problem.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        timeLimit: data.timeLimit,
        memoryLimit: data.memoryLimit,
        editorial: data.editorial,
        exampleInput: data.exampleInput,
        exampleOutput: data.exampleOutput,
        isPublished: data.isPublished ?? false,
        isPremium: data.isPremium ?? false,
      },
    });
  }

  async updateProblem(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      difficulty: Difficulty;
      tags: string[];
      timeLimit: number;
      memoryLimit: number;
      editorial: string;
      exampleInput: string;
      exampleOutput: string;
      isPublished: boolean;
      isPremium: boolean;
    }>
  ): Promise<Problem> {
    return prisma.problem.update({
      where: { id },
      data,
    });
  }

  async getProblemWithTestCases(id: string) {
    return prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: true,
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async searchProblems(
    filter: ProblemFilter,
    skip: number = 0,
    take: number = 20
  ): Promise<{ problems: Problem[]; total: number }> {
    const where: any = {
      isPublished: filter.isPublished !== false,
    };

    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }

    if (filter.isPremium !== undefined) {
      where.isPremium = filter.isPremium;
    }

    if (filter.tags && filter.tags.length > 0) {
      where.tags = {
        hasSome: filter.tags,
      };
    }

    if (filter.search) {
      where.OR = [
        { title: { search: filter.search, mode: 'insensitive' } },
        { description: { search: filter.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    switch (filter.sortBy) {
      case 'recent':
        orderBy.createdAt = filter.sortOrder || 'desc';
        break;
      case 'popular':
        orderBy.totalSubmissions = filter.sortOrder || 'desc';
        break;
      case 'trending':
        orderBy.views = filter.sortOrder || 'desc';
        break;
      case 'difficulty':
        orderBy.difficulty = filter.sortOrder || 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          totalSubmissions: true,
          acceptedCount: true,
          successRate: true,
          isPublished: true,
          isPremium: true,
          views: true,
          createdAt: true,
        },
      }),
      prisma.problem.count({ where }),
    ]);

    return { problems: problems as Problem[], total };
  }

  async getProblemStats(id: string) {
    const problem = await prisma.problem.findUnique({
      where: { id },
      select: {
        totalSubmissions: true,
        acceptedCount: true,
        successRate: true,
        averageScore: true,
        _count: {
          select: {
            submissions: true,
            testCases: true,
          },
        },
      },
    });

    return problem;
  }

  async incrementProblemViews(id: string): Promise<void> {
    await prisma.problem.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });
  }

  async updateSubmissionStats(
    id: string,
    data: {
      totalSubmissions?: number;
      acceptedCount?: number;
      successRate?: number;
      averageScore?: number;
    }
  ): Promise<void> {
    await prisma.problem.update({
      where: { id },
      data: {
        totalSubmissions: data.totalSubmissions,
        acceptedCount: data.acceptedCount,
        successRate: data.successRate,
        averageScore: data.averageScore,
      },
    });
  }

  async getProblemaByDifficulty(
    difficulty: Difficulty,
    skip: number = 0,
    take: number = 20
  ): Promise<{ problems: Problem[]; total: number }> {
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: {
          difficulty,
          isPublished: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          totalSubmissions: true,
          acceptedCount: true,
          successRate: true,
          createdAt: true,
        },
      }),
      prisma.problem.count({
        where: {
          difficulty,
          isPublished: true,
        },
      }),
    ]);

    return { problems: problems as Problem[], total };
  }

  async getProblemaByTag(
    tag: string,
    skip: number = 0,
    take: number = 20
  ): Promise<{ problems: Problem[]; total: number }> {
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where: {
          tags: {
            has: tag,
          },
          isPublished: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          totalSubmissions: true,
          acceptedCount: true,
          successRate: true,
          createdAt: true,
        },
      }),
      prisma.problem.count({
        where: {
          tags: {
            has: tag,
          },
          isPublished: true,
        },
      }),
    ]);

    return { problems: problems as Problem[], total };
  }

  async deleteProblem(id: string): Promise<void> {
    await prisma.problem.delete({
      where: { id },
    });
  }

  async publishProblem(id: string): Promise<Problem> {
    return prisma.problem.update({
      where: { id },
      data: {
        isPublished: true,
      },
    });
  }

  async unpublishProblem(id: string): Promise<Problem> {
    return prisma.problem.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });
  }
}
