import { z } from 'zod';

export const getRecommendationsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});

export const completePathNodeSchema = z.object({
  problemId: z.string().cuid('Invalid problem ID'),
});

export const getLearningPathSchema = z.object({});

export type GetRecommendationsInput = z.infer<typeof getRecommendationsSchema>;
export type CompletePathNodeInput = z.infer<typeof completePathNodeSchema>;
export type GetLearningPathInput = z.infer<typeof getLearningPathSchema>;
