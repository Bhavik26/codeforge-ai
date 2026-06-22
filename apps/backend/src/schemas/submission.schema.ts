import { z } from 'zod';

export const createSubmissionSchema = z.object({
  problemId: z.string().cuid('Invalid problem ID'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(100000, 'Code is too large (max 100KB)'),
  language: z
    .enum(['cpp', 'python', 'javascript', 'java'])
    .describe('Programming language'),
});

export const getSubmissionsSchema = z.object({
  skip: z.number().min(0).optional().default(0),
  take: z.number().min(1).max(100).optional().default(20),
  status: z
    .enum(['PENDING', 'COMPILING', 'EXECUTING', 'COMPLETED', 'FAILED'])
    .optional(),
  verdict: z
    .enum([
      'PENDING',
      'COMPILATION_ERROR',
      'RUNTIME_ERROR',
      'TIME_LIMIT_EXCEEDED',
      'MEMORY_LIMIT_EXCEEDED',
      'WRONG_ANSWER',
      'ACCEPTED',
      'PARTIAL',
    ])
    .optional(),
  sortBy: z.enum(['recent', 'oldest']).optional().default('recent'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GetSubmissionsInput = z.infer<typeof getSubmissionsSchema>;
