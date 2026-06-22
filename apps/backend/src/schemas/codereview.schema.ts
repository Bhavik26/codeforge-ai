import { z } from 'zod';

export const triggerCodeReviewSchema = z.object({
  submissionId: z.string().cuid('Invalid submission ID'),
  sync: z.boolean().optional().default(false),
});

export const getCodeReviewSchema = z.object({
  submissionId: z.string().cuid('Invalid submission ID'),
});

export const getMyReviewsSchema = z.object({
  skip: z.coerce.number().min(0).optional().default(0),
  take: z.coerce.number().min(1).max(100).optional().default(20),
});

export type TriggerCodeReviewInput = z.infer<typeof triggerCodeReviewSchema>;
export type GetCodeReviewInput = z.infer<typeof getCodeReviewSchema>;
export type GetMyReviewsInput = z.infer<typeof getMyReviewsSchema>;
