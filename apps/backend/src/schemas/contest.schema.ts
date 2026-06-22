import { z } from 'zod';

export const createContestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  registrationStart: z.coerce.date(),
  registrationEnd: z.coerce.date(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  maxParticipants: z.coerce.number().positive().optional(),
  totalPoints: z.coerce.number().nonnegative().optional(),
  scoringType: z.enum(['POINTS', 'TIME_BASED', 'ACM_ICPC']).optional(),
  negativeScore: z.coerce.number().nonnegative().optional(),
}).refine((data) => data.startTime < data.endTime, {
  message: 'Start time must be before end time',
  path: ['startTime'],
}).refine((data) => data.registrationStart < data.registrationEnd, {
  message: 'Registration start must be before registration end',
  path: ['registrationStart'],
});

export const getContestsSchema = z.object({
  skip: z.coerce.number().min(0).optional().default(0),
  take: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.enum(['UPCOMING', 'ONGOING', 'ENDED', 'CANCELLED']).optional(),
});

export type CreateContestInput = z.infer<typeof createContestSchema>;
export type GetContestsInput = z.infer<typeof getContestsSchema>;
