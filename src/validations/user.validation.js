import { z } from 'zod';

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: 'User id must be a number' }).int().positive()
});

export const createUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Must be a valid email address'),
    fullname: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(1, 'Full name is required')
      .max(100, 'Full name must be at most 100 characters')
  })
});

export const userIdSchema = z.object({
  params: idParam
});

export const updateUserStatusSchema = z.object({
  params: idParam,
  body: z.object({
    isActive: z.boolean({ required_error: 'isActive is required' })
  })
});
