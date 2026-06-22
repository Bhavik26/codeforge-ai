import { prisma } from '../config/database';
import { BaseRepository } from './BaseRepository';
import { TestCase } from '@prisma/client';

export class TestCaseRepository extends BaseRepository<TestCase> {
  constructor() {
    super(prisma.testCase);
  }

  async createTestCase(data: {
    problemId: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
    isExample?: boolean;
  }): Promise<TestCase> {
    return prisma.testCase.create({
      data: {
        problemId: data.problemId,
        input: data.input,
        expectedOutput: data.expectedOutput,
        explanation: data.explanation,
        isHidden: data.isHidden ?? false,
        isExample: data.isExample ?? false,
      },
    });
  }

  async getTestCasesByProblemId(
    problemId: string,
    options?: {
      includeHidden?: boolean;
      skip?: number;
      take?: number;
    }
  ): Promise<TestCase[]> {
    const where: any = { problemId };

    if (!options?.includeHidden) {
      where.isHidden = false;
    }

    return prisma.testCase.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async countTestCasesByProblemId(problemId: string): Promise<number> {
    return prisma.testCase.count({
      where: { problemId },
    });
  }

  async getExampleTestCases(problemId: string): Promise<TestCase[]> {
    return prisma.testCase.findMany({
      where: {
        problemId,
        isExample: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTestCase(
    id: string,
    data: Partial<{
      input: string;
      expectedOutput: string;
      explanation: string;
      isHidden: boolean;
      isExample: boolean;
    }>
  ): Promise<TestCase> {
    return prisma.testCase.update({
      where: { id },
      data,
    });
  }

  async deleteTestCase(id: string): Promise<void> {
    await prisma.testCase.delete({
      where: { id },
    });
  }

  async deleteTestCasesByProblemId(problemId: string): Promise<void> {
    await prisma.testCase.deleteMany({
      where: { problemId },
    });
  }

  async getTestCaseById(id: string): Promise<TestCase | null> {
    return prisma.testCase.findUnique({
      where: { id },
    });
  }

  async bulkCreateTestCases(
    testCases: Array<{
      problemId: string;
      input: string;
      expectedOutput: string;
      explanation?: string;
      isHidden?: boolean;
      isExample?: boolean;
    }>
  ): Promise<TestCase[]> {
    const created = await Promise.all(
      testCases.map((tc) => this.createTestCase(tc))
    );
    return created;
  }
}
