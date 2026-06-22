import { Queue as BullQueue, Worker, QueueOptions, WorkerOptions, Job } from 'bullmq';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export interface JobData {
  [key: string]: any;
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export abstract class Queue<T extends JobData = JobData> {
  protected queue: BullQueue<T>;
  protected worker: Worker<T> | null = null;
  protected queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;

    const queueOptions: QueueOptions = {
      connection: redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    };

    this.queue = new BullQueue<T>(queueName, queueOptions);

    this.setupEventListeners();
  }

  protected setupEventListeners(): void {
    this.queue.on('error', (error) => {
      logger.error(`Queue error in ${this.queueName}`, error);
    });

    (this.queue as any).on('waiting', (job: any) => {
      logger.debug(`Job waiting in ${this.queueName}: ${job.id}`);
    });

    (this.queue as any).on('active', (job: any) => {
      logger.debug(`Job active in ${this.queueName}: ${job.id}`);
    });

    (this.queue as any).on('completed', (job: any) => {
      logger.info(`Job completed in ${this.queueName}: ${job.id}`);
    });

    (this.queue as any).on('failed', (job: any, err: any) => {
      logger.error(`Job failed in ${this.queueName}: ${job?.id} - ${err.message}`);
    });
  }

  /**
   * Add job to queue
   */
  async addJob(data: T, options?: JobOptions): Promise<Job<T>> {
    try {
      const job = await this.queue.add(this.queueName as any, data as any, {
        priority: options?.priority || 0,
        delay: options?.delay,
        attempts: options?.attempts || 3,
        backoff: options?.backoff,
        removeOnComplete: options?.removeOnComplete !== false,
      });

      logger.debug(`Job added to ${this.queueName}: ${job.id}`);
      return job as any;
    } catch (error) {
      logger.error(`Error adding job to ${this.queueName}`, error);
      throw error;
    }
  }

  /**
   * Add multiple jobs to queue
   */
  async addBulkJobs(jobs: Array<{ data: T; options?: JobOptions }>): Promise<Job<T>[]> {
    const bullJobs = jobs.map((job) => ({
      name: this.queueName as any,
      data: job.data as any,
      opts: {
        priority: job.options?.priority || 0,
        delay: job.options?.delay,
        attempts: job.options?.attempts || 3,
        backoff: job.options?.backoff,
        removeOnComplete: job.options?.removeOnComplete !== false,
      },
    }));

    try {
      const results = await this.queue.addBulk(bullJobs);
      logger.debug(`${results.length} jobs added to ${this.queueName}`);
      return results as any;
    } catch (error) {
      logger.error(`Error adding bulk jobs to ${this.queueName}`, error);
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<T> | undefined> {
    return this.queue.getJob(jobId);
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  }

  /**
   * Clear queue
   */
  async clear(): Promise<void> {
    await this.queue.clean(0, 100000);
    logger.info(`Queue ${this.queueName} cleared`);
  }

  /**
   * Close queue
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.queue.close();
    logger.info(`Queue ${this.queueName} closed`);
  }

  /**
   * Abstract method to process jobs
   */
  protected abstract processJob(job: Job<T>): Promise<any>;

  /**
   * Start processing jobs
   */
  async startProcessing(concurrency: number = 1): Promise<void> {
    const workerOptions: WorkerOptions = {
      connection: redis as any,
      concurrency,
    };

    this.worker = new Worker<T>(
      this.queueName,
      async (job) => {
        try {
          const result = await this.processJob(job);
          return result;
        } catch (error) {
          logger.error(`Error processing job ${job.id}`, error);
          throw error;
        }
      },
      workerOptions
    );

    this.worker.on('completed', (job) => {
      logger.info(`Worker processed job ${this.queueName}: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Worker failed to process job ${this.queueName}: ${job?.id} - ${err.message}`);
    });

    logger.info(`Worker started for queue ${this.queueName} (concurrency: ${concurrency})`);
  }
}

// Global queue instances
const queues: Map<string, Queue> = new Map();

export const registerQueue = (queue: Queue): void => {
  queues.set(queue.constructor.name, queue);
};

export const initializeQueues = async (): Promise<void> => {
  logger.info('All queues initialized');
};
