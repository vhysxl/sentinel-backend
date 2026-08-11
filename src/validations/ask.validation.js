import { z } from 'zod';

export const askSchema = z.object({
  body: z.object({
    // Capped because every question costs two LLM round trips against a shared
    // quota. A finance question does not need more room than this, and the
    // limit stops a pasted wall of text from burning the budget.
    question: z
      .string({ required_error: 'Question is required' })
      .trim()
      .min(1, 'Question is required')
      .max(500, 'Question must be at most 500 characters')
  })
});
