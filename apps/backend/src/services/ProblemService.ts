import { ProblemRepository, ProblemFilter } from '../repositories/ProblemRepository';
import { CreateProblemInput, UpdateProblemInput, SearchProblemInput } from '../schemas/problem.schema';
import { Difficulty } from '@prisma/client';
import { prisma } from '../config/database';

export class ProblemService {
  private problemRepository: ProblemRepository;

  constructor() {
    this.problemRepository = new ProblemRepository();
  }

  async createProblem(input: CreateProblemInput) {
    const existingProblem = await this.problemRepository.findBySlug(input.slug);
    if (existingProblem) {
      throw new Error('Problem with this slug already exists');
    }

    // Backward-compatible mapping:
    // - Prisma currently stores tags[] (no category field), constraints/examples are pending Prisma migration.
    // - Use:
    //   - category -> first tag
    //   - tags -> merged
    //   - constraints -> ignored for now (to be persisted after Prisma migration)
    //   - examples[] -> map first example to exampleInput/exampleOutput
    const tags = Array.from(
      new Set([
        ...(input.category ? [input.category] : []),
        ...(input.tags ?? []),
      ])
    );

    const firstExample = input.examples?.[0];

    return this.problemRepository.createProblem({
      title: input.title,
      slug: input.slug,
      description: input.description,
      difficulty: input.difficulty as Difficulty,
      tags,
      timeLimit: input.timeLimit,
      memoryLimit: input.memoryLimit,
      editorial: input.editorial ?? input.explanation ?? undefined,
      exampleInput: firstExample?.input ?? undefined,
      exampleOutput: firstExample?.output ?? undefined,
      isPublished: input.isPublished ?? false,
      isPremium: input.isPremium ?? false,
    });
  }

  async updateProblem(id: string, input: UpdateProblemInput) {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new Error('Problem not found');
    }

    if (input.slug && input.slug !== problem.slug) {
      const existingProblem = await this.problemRepository.findBySlug(input.slug);
      if (existingProblem) {
        throw new Error('Problem with this slug already exists');
      }
    }

    // Backward-compatible mapping for update:
    // - category -> appended/merged into tags (optional)
    // - examples -> map first example into exampleInput/exampleOutput
    const tags = input.tags;
    const firstExample = input.examples?.[0];

    return this.problemRepository.updateProblem(id, {
      title: input.title,
      description: input.description,
      difficulty: input.difficulty as Difficulty,
      tags,
      timeLimit: input.timeLimit,
      memoryLimit: input.memoryLimit,
      editorial: input.editorial ?? input.explanation,
      // Prisma currently supports only a single example via exampleInput/exampleOutput.
      // When multiple examples are supported, this mapping will evolve.
      exampleInput: firstExample?.input,
      exampleOutput: firstExample?.output,
      isPublished: input.isPublished,
      isPremium: input.isPremium,
    });
  }

  async getProblemById(id: string) {
    const problem = await this.problemRepository.getProblemWithTestCases(id);
    if (!problem) {
      throw new Error('Problem not found');
    }

    await this.problemRepository.incrementProblemViews(id);

    return problem;
  }

  async getProblemBySlug(slug: string) {
    const problem = await this.problemRepository.findBySlug(slug);
    if (!problem) {
      throw new Error('Problem not found');
    }

    await this.problemRepository.incrementProblemViews(problem.id);

    return problem;
  }

  async searchProblems(input: SearchProblemInput) {
    const filter: ProblemFilter = {
      difficulty: input.difficulty as Difficulty,
      tags: input.tags,
      search: input.search,
      isPublished: input.isPublished,
      isPremium: input.isPremium,
      sortBy: input.sortBy as any,
      sortOrder: input.sortOrder as any,
    };

    return this.problemRepository.searchProblems(
      filter,
      input.skip || 0,
      input.take || 20
    );
  }

  async getProblemsByDifficulty(difficulty: Difficulty, skip: number = 0, take: number = 20) {
    return this.problemRepository.getProblemaByDifficulty(difficulty, skip, take);
  }

  async getProblemsByTag(tag: string, skip: number = 0, take: number = 20) {
    return this.problemRepository.getProblemaByTag(tag, skip, take);
  }

  async deleteProblem(id: string) {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new Error('Problem not found');
    }

    await this.problemRepository.deleteProblem(id);
  }

  async publishProblem(id: string) {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new Error('Problem not found');
    }

    if ((await prisma.testCase.count({ where: { problemId: id } })) === 0) {
      throw new Error('Cannot publish problem without test cases');
    }

    return this.problemRepository.publishProblem(id);
  }

  async unpublishProblem(id: string) {
    const problem = await this.problemRepository.findById(id);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.problemRepository.unpublishProblem(id);
  }

  async getProblemStats(id: string) {
    const stats = await this.problemRepository.getProblemStats(id);
    if (!stats) {
      throw new Error('Problem not found');
    }

    return stats;
  }

  async getTopProblems(limit: number = 10) {
    const problems = await prisma.problem.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        totalSubmissions: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        totalSubmissions: true,
        acceptedCount: true,
        successRate: true,
      },
    });

    return problems;
  }

  async getRecentProblems(limit: number = 10) {
    const problems = await prisma.problem.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        createdAt: true,
      },
    });

    return problems;
  }
}
