import Docker, { Container } from 'dockerode';
import { logger } from '../config/logger';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
}

export interface ExecutionOptions {
  timeLimit: number;
  memoryLimit: number;
  language: string;
  code: string;
  input: string;
}

export class DockerExecutor {
  private docker: Docker;
  private containerMap: Map<string, Container> = new Map();

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock',
    });
  }

  private getLanguageConfig(language: string): {
    image: string;
    filename: string;
    compileCommand?: string[];
    runCommand: string[];
  } {
    const configs: {
      [key: string]: {
        image: string;
        filename: string;
        compileCommand?: string[];
        runCommand: string[];
      };
    } = {
      cpp: {
        image: 'gcc:11-alpine',
        filename: 'solution.cpp',
        compileCommand: ['g++', '-o', 'solution', '-O2', 'solution.cpp'],
        runCommand: ['./solution'],
      },
      python: {
        image: 'python:3.11-alpine',
        filename: 'solution.py',
        runCommand: ['python', 'solution.py'],
      },
      javascript: {
        image: 'node:18-alpine',
        filename: 'solution.js',
        runCommand: ['node', 'solution.js'],
      },
      java: {
        image: 'openjdk:17-alpine',
        filename: 'Solution.java',
        compileCommand: ['javac', 'Solution.java'],
        runCommand: ['java', 'Solution'],
      },
    };

    if (!configs[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return configs[language];
  }

  async execute(options: ExecutionOptions): Promise<ExecutionResult> {
    const { language, code, input, timeLimit, memoryLimit } = options;
    const config = this.getLanguageConfig(language);

    let container: Container | null = null;
    const startTime = Date.now();

    try {
      container = await this.createContainer(
        config.image,
        code,
        config.filename,
        config.compileCommand,
        config.runCommand,
        timeLimit,
        memoryLimit,
        input
      );

      const result = await this.runContainer(container, timeLimit);
      const executionTime = Date.now() - startTime;

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime,
        memoryUsed: this.estimateMemoryUsage(memoryLimit),
      };
    } catch (error) {
      logger.error('Docker execution error', error);
      throw error;
    } finally {
      if (container) {
        await this.cleanupContainer(container);
      }
    }
  }

  private async createContainer(
    image: string,
    code: string,
    filename: string,
    compileCommand: string[] | undefined,
    runCommand: string[],
    _timeLimit: number,
    memoryLimit: number,
    input: string
  ): Promise<Container> {
    const setupScript = this.generateSetupScript(
      code,
      filename,
      compileCommand,
      runCommand,
      input
    );

    const container = await this.docker.createContainer({
      Image: image,
      Cmd: ['/bin/sh', '-c', setupScript],
      HostConfig: {
        Memory: memoryLimit * 1024 * 1024,
        MemorySwap: memoryLimit * 1024 * 1024,
        CpuQuota: 100000,
        CpuPeriod: 100000,
        ReadonlyRootfs: false,
        NetworkMode: 'none',
      },
      NetworkDisabled: true,
      StdinOnce: false,
      OpenStdin: true,
    });

    this.containerMap.set(container.id, container);
    return container;
  }

  private generateSetupScript(
    code: string,
    filename: string,
    compileCommand: string[] | undefined,
    runCommand: string[],
    input: string
  ): string {
    let script = `cat > ${filename} << 'EOF'\n${code}\nEOF\n`;

    if (compileCommand) {
      script += `${compileCommand.join(' ')} && `;
    }

    script += `echo '${input.replace(/'/g, "'\\''")}' | ${runCommand.join(' ')}`;

    return script;
  }

  private async runContainer(
    container: Container,
    timeLimit: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          await container.kill();
          reject(new Error('TIME_LIMIT_EXCEEDED'));
        } catch (error) {
          reject(error);
        }
      }, timeLimit + 1000);

      container.attach(
        { stream: true, stdout: true, stderr: true },
        async (error, stream) => {
          if (error) {
            clearTimeout(timeoutId);
            return reject(error);
          }

          if (!stream) {
            clearTimeout(timeoutId);
            return reject(new Error('No stream returned from container attach'));
          }

          let stdout = '';
          let stderr = '';

          stream.on('data', (chunk) => {
            stdout += chunk.toString();
          });

          stream.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });

          stream.on('end', async () => {
            try {
              clearTimeout(timeoutId);
              const response = await container.wait();
              const exitCode = response.StatusCode || 0;

              resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode,
              });
            } catch (error) {
              reject(error);
            }
          });

          await container.start();
        }
      );
    });
  }

  private async cleanupContainer(container: Container): Promise<void> {
    try {
      await container.stop({ t: 1 });
      await container.remove({ force: true });
      this.containerMap.delete(container.id);
      logger.debug(`Container ${container.id} cleaned up`);
    } catch (error) {
      logger.error(`Error cleaning up container ${container.id}`, error);
    }
  }

  private estimateMemoryUsage(limit: number): number {
    return Math.floor(limit * 0.7);
  }

  async cleanup(): Promise<void> {
    for (const [, container] of this.containerMap) {
      await this.cleanupContainer(container);
    }
  }
}

export const dockerExecutor = new DockerExecutor();
