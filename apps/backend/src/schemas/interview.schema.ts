import { z } from 'zod';

export const startInterviewSchema = z.object({
  problemId: z.string().cuid('Invalid problem ID'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional().default('MEDIUM'),
  topic: z.string().optional().default('Algorithms'),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().cuid('Invalid question ID'),
  userAnswer: z.string().min(1, 'Answer is required'),
  language: z.string().optional().default('javascript'),
  timeSpent: z.coerce.number().min(0).optional().default(120),
});

export const getInterviewSessionSchema = z.object({
  id: z.string().cuid('Invalid interview ID'),
});

export const getMyInterviewsSchema = z.object({
  skip: z.coerce.number().min(0).optional().default(0),
  take: z.coerce.number().min(1).max(100).optional().default(20),
});

export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type GetInterviewSessionInput = z.infer<typeof getInterviewSessionSchema>;
export type GetMyInterviewsInput = z.infer<typeof getMyInterviewsSchema>;
