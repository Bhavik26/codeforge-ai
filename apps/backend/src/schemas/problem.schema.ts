import { z } from 'zod';

// NOTE: Prisma model fields (apps/backend/prisma/schema.prisma)
// Problem:
// - title (String)
// - slug (String, unique)
// - description (String)
// - difficulty (Difficulty enum)
// - tags (String[])
// - timeLimit (Int)
// - memoryLimit (Int)
// - editorial (String?)
// - exampleInput (String?)
// - exampleOutput (String?)
// - isPublished (Boolean)
// - isPremium (Boolean)
//
// Phase 2 requirement adds constraints + examples/explanation.
// Until we finalize Prisma changes, we validate the shape we will persist:
// - constraints: string[] (simple representation)
// - examples: { input: string; output: string; explanation?: string }[]

export const constraintSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const exampleSchema = z.object({
  input: z.string().min(1).max(100000),
  output: z.string().min(1).max(100000),
  explanation: z.string().max(5000).optional(),
});

export const createProblemSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug must be URL-friendly'),
  description: z.string().min(20).max(20000),

  // Map requirement fields
  // - Category -> we currently persist as tags (or later add category)
  // - constraints -> string[]
  // - explanation -> editorial
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),

  // Requirement: Category
  // Currently Prisma has no `category` field; treat it as tags[0..n] or single tag.
  // Admin can send either `category` (string) or `tags` (string[]).
  category: z.string().min(2).max(50).optional(),

  // Requirement: Add tags
  tags: z.array(z.string().min(1).max(50)).max(50).optional(),

  constraints: z.array(z.string().min(1).max(2000)).max(100).optional(),

  // Requirement: Examples
  // We persist as `exampleInput`/`exampleOutput` for backward compat (first example),
  // and keep full `examples` for upcoming Prisma expansion.
  examples: z.array(exampleSchema).max(20).optional(),

  // Requirement: Add explanation
  // Persist into Prisma `editorial`.
  editorial: z.string().max(20000).optional(),
  explanation: z.string().max(20000).optional(),

  timeLimit: z.number().int().min(1).max(30).default(1), // seconds
  memoryLimit: z.number().int().min(32).max(4096).default(256), // MB

  isPublished: z.boolean().optional().default(false),
  isPremium: z.boolean().optional().default(false),
});

export const updateProblemSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug must be URL-friendly')
    .optional(),
  description: z.string().min(20).max(20000).optional(),

  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),

  category: z.string().min(2).max(50).optional(),
  tags: z.array(z.string().min(1).max(50)).max(50).optional(),

  constraints: z.array(z.string().min(1).max(2000)).max(100).optional(),

  examples: z.array(exampleSchema).max(20).optional(),

  editorial: z.string().max(20000).optional(),
  explanation: z.string().max(20000).optional(),

  timeLimit: z.number().int().min(1).max(30).optional(),
  memoryLimit: z.number().int().min(32).max(4096).optional(),

  isPublished: z.boolean().optional(),
  isPremium: z.boolean().optional(),
});

export const searchProblemSchema = z
  .object({
    search: z.string().min(1).max(200).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),

    // Requirement: filter by category/tag
    tags: z
      .union([z.string(), z.array(z.string().min(1).max(50))])
      .optional(),

    isPublished: z.boolean().optional(),
    isPremium: z.boolean().optional(),

    sortBy: z
      .union([z.literal('recent'), z.literal('popular'), z.literal('trending'), z.literal('difficulty')])
      .optional(),
    sortOrder: z.union([z.literal('asc'), z.literal('desc')]).optional(),

    skip: z.coerce.number().int().min(0).optional(),
    take: z.coerce.number().int().min(1).max(50).optional(),
  })
  .transform((v) => {
    const normalizedTags =
      typeof v.tags === 'string'
        ? v.tags
          ? [v.tags]
          : undefined
        : v.tags;

    return {
      ...v,
      tags: normalizedTags,
    };
  });

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type SearchProblemInput = z.infer<typeof searchProblemSchema>;

