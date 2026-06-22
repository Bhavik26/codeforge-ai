import { z } from 'zod';

export const createTestCaseSchema = z.object({
  problemId: z.string().cuid('Invalid problem ID'),
  input: z
    .string()
    .min(1, 'Input is required')
    .max(100000, 'Input is too large'),
  expectedOutput: z
    .string()
    .min(1, 'Expected output is required')
    .max(100000, 'Expected output is too large'),
  explanation: z
    .string()
    .max(5000, 'Explanation is too long')
    .optional(),
  isHidden: z.boolean().optional().default(false),
  isExample: z.boolean().optional().default(false),
});

export const updateTestCaseSchema = z.object({
  input: z
    .string()
    .min(1, 'Input is required')
    .max(100000, 'Input is too large')
    .optional(),
  expectedOutput: z
    .string()
    .min(1, 'Expected output is required')
    .max(100000, 'Expected output is too large')
    .optional(),
  explanation: z
    .string()
    .max(5000, 'Explanation is too long')
    .optional(),
  isHidden: z.boolean().optional(),
  isExample: z.boolean().optional(),
});

export const bulkCreateTestCasesSchema = z.object({
  problemId: z.string().cuid('Invalid problem ID'),
  testCases: z
    .array(
      z.object({
        input: z
          .string()
          .min(1, 'Input is required')
          .max(100000, 'Input is too large'),
        expectedOutput: z
          .string()
          .min(1, 'Expected output is required')
          .max(100000, 'Expected output is too large'),
        explanation: z
          .string()
          .max(5000, 'Explanation is too long')
          .optional(),
        isHidden: z.boolean().optional().default(false),
        isExample: z.boolean().optional().default(false),
      })
    )
    .min(1, 'At least one test case is required')
    .max(100, 'Maximum 100 test cases allowed'),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>;
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>;
export type BulkCreateTestCasesInput = z.infer<typeof bulkCreateTestCasesSchema>;
