import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { DockerExecutor } from '../services/DockerExecutor';
import { SubmissionService, JudgeJobData } from '../services/SubmissionService';
import { SubmissionStatus, SubmissionVerdict, TestCaseStatus } from '@prisma/client';

class JudgeWorker {
  private worker: Worker<JudgeJobData> | null = null;
  private dockerExecutor: DockerExecutor;
  private submissionService: SubmissionService;
  private isRunning: boolean = false;

  constructor() {
    this.dockerExecutor = new DockerExecutor();
    this.submissionService = new SubmissionService();
  }

  async initialize(): Promise<void> {
    try {
      this.worker = new Worker<JudgeJobData>(
        'judge-queue',
        async (job) => {
          return this.processSubmission(job);
        },
        {
          connection: redis as any,
          concurrency: 5,
        }
      );

      this.worker.on('completed', (job) => {
        logger.info(`Judge job completed: ${job.id} - Submission ${job.data.submissionId}`);
      });

      this.worker.on('failed', (job, error) => {
        logger.error(
          `Judge job failed: ${job?.id} - ${error.message}`,
          error
        );
      });

      this.worker.on('error', (error) => {
        logger.error('Judge worker error', error);
      });

      this.isRunning = true;
      logger.info('Judge worker initialized and listening');
    } catch (error) {
      logger.error('Failed to initialize judge worker', error);
      throw error;
    }
  }

  private async processSubmission(job: Job<JudgeJobData>): Promise<any> {
    const { submissionId, problemId, code, language, timeLimit, memoryLimit } = job.data;

    try {
      logger.info(`Processing submission ${submissionId}`);

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        include: {
          testCases: true,
        },
      });

      if (!problem || !problem.testCases) {
        throw new Error(`Problem ${problemId} or its test cases not found`);
      }

      await this.submissionService.updateSubmissionResults(submissionId, {
        status: SubmissionStatus.COMPILING,
        verdict: SubmissionVerdict.PENDING,
      });

      let compilationError: string | undefined;

      if (['cpp', 'java'].includes(language)) {
        const compileResult = await this.dockerExecutor.execute({
          language,
          code,
          input: '',
          timeLimit: timeLimit / 2,
          memoryLimit,
        });

        if (compileResult.exitCode !== 0) {
          compilationError = compileResult.stderr;

          await this.submissionService.updateSubmissionResults(submissionId, {
            status: SubmissionStatus.COMPLETED,
            verdict: SubmissionVerdict.COMPILATION_ERROR,
            compilationError,
            totalTestCases: problem.testCases.length,
            passedTestCases: 0,
          });

          logger.info(`Compilation failed for submission ${submissionId}`);
          return { submissionId, verdict: 'COMPILATION_ERROR' };
        }
      }

      await this.submissionService.updateSubmissionResults(submissionId, {
        status: SubmissionStatus.EXECUTING,
        verdict: SubmissionVerdict.PENDING,
      });

      const testResults = [];
      let passedCount = 0;
      let totalExecutionTime = 0;
      let maxMemoryUsed = 0;
      let hasRuntimeError = false;
      let hasTimeLimitExceeded = false;
      let hasMemoryLimitExceeded = false;
      let hasWrongAnswer = false;

      for (const testCase of problem.testCases) {
        const testStartTime = Date.now();

        try {
          const result = await this.dockerExecutor.execute({
            language,
            code,
            input: testCase.input,
            timeLimit,
            memoryLimit,
          });

          const executionTime = Date.now() - testStartTime;
          totalExecutionTime += executionTime;
          maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);

          let testStatus: TestCaseStatus = TestCaseStatus.PASSED;
          const actualOutput = result.stdout.trim();
          const expectedOutput = testCase.expectedOutput.trim();

          if (actualOutput !== expectedOutput) {
            testStatus = TestCaseStatus.FAILED;
            hasWrongAnswer = true;
          }

          if (executionTime > timeLimit) {
            testStatus = TestCaseStatus.TIME_LIMIT_EXCEEDED;
            hasTimeLimitExceeded = true;
          }

          if (result.memoryUsed > memoryLimit) {
            testStatus = TestCaseStatus.MEMORY_LIMIT_EXCEEDED;
            hasMemoryLimitExceeded = true;
          }

          if (result.exitCode !== 0 && !hasWrongAnswer) {
            testStatus = TestCaseStatus.RUNTIME_ERROR;
            hasRuntimeError = true;
          }

          if (testStatus === TestCaseStatus.PASSED) {
            passedCount++;
          }

          await prisma.submissionResult.create({
            data: {
              submissionId,
              testCaseId: testCase.id,
              status: testStatus,
              expectedOutput: testCase.expectedOutput,
              actualOutput,
              executionTime,
              memoryUsed: result.memoryUsed,
              errorMessage: result.stderr || undefined,
            },
          });

          testResults.push({
            testCaseId: testCase.id,
            status: testStatus,
            executionTime,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';

          let testStatus: TestCaseStatus = TestCaseStatus.RUNTIME_ERROR;

          if (errorMsg === 'TIME_LIMIT_EXCEEDED') {
            testStatus = TestCaseStatus.TIME_LIMIT_EXCEEDED;
            hasTimeLimitExceeded = true;
          } else if (errorMsg.includes('MEMORY')) {
            testStatus = TestCaseStatus.MEMORY_LIMIT_EXCEEDED;
            hasMemoryLimitExceeded = true;
          }

          await prisma.submissionResult.create({
            data: {
              submissionId,
              testCaseId: testCase.id,
              status: testStatus,
              expectedOutput: testCase.expectedOutput,
              actualOutput: '',
              errorMessage: errorMsg,
            },
          });

          testResults.push({
            testCaseId: testCase.id,
            status: testStatus,
          });
        }
      }

      let verdict: SubmissionVerdict = SubmissionVerdict.ACCEPTED;
      let score = 0;

      if (compilationError) {
        verdict = SubmissionVerdict.COMPILATION_ERROR;
      } else if (hasRuntimeError) {
        verdict = SubmissionVerdict.RUNTIME_ERROR;
      } else if (hasTimeLimitExceeded) {
        verdict = SubmissionVerdict.TIME_LIMIT_EXCEEDED;
      } else if (hasMemoryLimitExceeded) {
        verdict = SubmissionVerdict.MEMORY_LIMIT_EXCEEDED;
      } else if (hasWrongAnswer) {
        verdict = SubmissionVerdict.WRONG_ANSWER;
        score = Math.floor((passedCount / problem.testCases.length) * 100);
      } else if (passedCount === problem.testCases.length) {
        verdict = SubmissionVerdict.ACCEPTED;
        score = 100;
      }

      await this.submissionService.updateSubmissionResults(submissionId, {
        status: SubmissionStatus.COMPLETED,
        verdict,
        executionTime: totalExecutionTime,
        memoryUsed: maxMemoryUsed,
        score,
        totalTestCases: problem.testCases.length,
        passedTestCases: passedCount,
      });

      logger.info(`Submission ${submissionId} judged: ${verdict}`);

      return {
        submissionId,
        verdict,
        score,
        passedTestCases: passedCount,
        totalTestCases: problem.testCases.length,
      };
    } catch (error) {
      logger.error(`Error processing submission ${submissionId}`, error);

      await this.submissionService.updateSubmissionResults(submissionId, {
        status: SubmissionStatus.FAILED,
        verdict: SubmissionVerdict.RUNTIME_ERROR,
        runtimeError: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.close();
      }
      await this.dockerExecutor.cleanup();
      this.isRunning = false;
      logger.info('Judge worker shut down');
    } catch (error) {
      logger.error('Error shutting down judge worker', error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}

let judgeWorkerInstance: JudgeWorker | null = null;

export const initializeWorkers = async (): Promise<void> => {
  try {
    logger.info('Initializing judge worker...');
    judgeWorkerInstance = new JudgeWorker();
    await judgeWorkerInstance.initialize();
    logger.info('Judge worker initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize judge worker', error);
    throw error;
  }
};

export const shutdownWorkers = async (): Promise<void> => {
  try {
    if (judgeWorkerInstance) {
      await judgeWorkerInstance.shutdown();
    }
  } catch (error) {
    logger.error('Failed to shutdown judge worker', error);
    throw error;
  }
};

export const getJudgeWorkerStatus = (): { healthy: boolean } => {
  return {
    healthy: judgeWorkerInstance?.isHealthy() ?? false,
  };
};
