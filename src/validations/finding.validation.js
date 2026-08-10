import { z } from 'zod';
import { RESOLUTIONS, RISK_LEVELS, FINDING_STATUS_FILTERS } from '../constants/index.js';

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: 'Finding id must be a number' }).int().positive()
});

export const listFindingsSchema = z.object({
  query: z.object({
    status: z.enum(FINDING_STATUS_FILTERS).optional(),
    risk_level: z.enum(RISK_LEVELS).optional(),
    limit: z.coerce
      .number({ invalid_type_error: 'Limit must be a number' })
      .int()
      .positive()
      .max(100, 'Limit must be at most 100')
      .optional()
  })
});

export const findingIdSchema = z.object({
  params: idParam
});

export const resolveFindingSchema = z.object({
  params: idParam,
  body: z.object({
    resolution: z.enum(RESOLUTIONS, {
      required_error: 'Resolution is required',
      invalid_type_error: `Resolution must be one of: ${RESOLUTIONS.join(', ')}`
    }),
    note: z.string().trim().max(1000, 'Note must be at most 1000 characters').optional()
  })
  // `resolved_by` is intentionally absent: zod strips unknown keys, so a client
  // that sends one has it dropped here before the service overwrites it anyway.
});
