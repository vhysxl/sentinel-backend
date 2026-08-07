import { z } from 'zod';

const dateField = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Must be a valid date' })
  .optional();

export const dashboardSummarySchema = z.object({
  query: z
    .object({
      startDate: dateField,
      endDate: dateField
    })
    .superRefine((data, ctx) => {
      if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startDate must be before endDate',
          path: ['endDate']
        });
      }
    })
});
