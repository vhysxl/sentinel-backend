import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string({ required_error: 'Email, Username, or NISN is required' })
      .trim()
      .min(1, 'Identifier cannot be empty'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().optional(),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, 'New password must be at least 6 characters long'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .trim()
      .min(1, 'Refresh token cannot be empty'),
  }),
});
