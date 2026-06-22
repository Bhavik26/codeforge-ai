import { TestCaseRepository } from '../repositories/TestCaseRepository';
import { ProblemRepository } from '../repositories/ProblemRepository';
import {
  CreateTestCaseInput,
  UpdateTestCaseInput,
  BulkCreateTestCasesInput,
} from '../schemas/testcase.schema';

export class TestCaseService {
  private testCaseRepository: TestCaseRepository;
  private problemRepository: ProblemRepository;

  constructor() {
    this.testCaseRepository = new TestCaseRepository();
    this.problemRepository = new ProblemRepository();
  }

  async createTestCase(input: CreateTestCaseInput) {
    const problem = await this.problemRepository.findById(input.problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.testCaseRepository.createTestCase({
      problemId: input.problemId,
      input: input.input,
      expectedOutput: input.expectedOutput,
      explanation: input.explanation,
      isHidden: input.isHidden ?? false,
      isExample: input.isExample ?? false,
    });
  }

  async bulkCreateTestCases(input: BulkCreateTestCasesInput) {
    const problem = await this.problemRepository.findById(input.problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    const testCases = input.testCases.map((tc) => ({
      problemId: input.problemId,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      explanation: tc.explanation,
      isHidden: tc.isHidden ?? false,
      isExample: tc.isExample ?? false,
    }));

    return this.testCaseRepository.bulkCreateTestCases(testCases);
  }

  async updateTestCase(id: string, input: UpdateTestCaseInput) {
    const testCase = await this.testCaseRepository.findById(id);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    return this.testCaseRepository.updateTestCase(id, {
      input: input.input,
      expectedOutput: input.expectedOutput,
      explanation: input.explanation,
      isHidden: input.isHidden,
      isExample: input.isExample,
    });
  }

  async getTestCasesByProblemId(
    problemId: string,
    options?: {
      includeHidden?: boolean;
      skip?: number;
      take?: number;
    }
  ) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.testCaseRepository.getTestCasesByProblemId(problemId, options);
  }

  async getTestCaseById(id: string) {
    const testCase = await this.testCaseRepository.getTestCaseById(id);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    return testCase;
  }

  async getExampleTestCases(problemId: string) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.testCaseRepository.getExampleTestCases(problemId);
  }

  async deleteTestCase(id: string) {
    const testCase = await this.testCaseRepository.findById(id);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    await this.testCaseRepository.deleteTestCase(id);
  }

  async countTestCases(problemId: string) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    return this.testCaseRepository.countTestCasesByProblemId(problemId);
  }

  async deleteAllTestCases(problemId: string) {
    const problem = await this.problemRepository.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    await this.testCaseRepository.deleteTestCasesByProblemId(problemId);
  }
}
