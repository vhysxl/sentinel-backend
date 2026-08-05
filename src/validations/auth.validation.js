import { z } from 'zod';

const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Must be a valid email address');

// Matches the frontend rule in sentinel/lib/validations/auth.schema.js
const newPasswordField = z
  .string({ required_error: 'New password is required' })
  .min(8, 'New password must be at least 8 characters');

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required')
  })
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z
      .string({ required_error: 'Google ID token is required' })
      .trim()
      .min(1, 'Google ID token is required')
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .trim()
      .min(1, 'Refresh token is required')
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    // Always required — unlike the pre-Sentinel implementation, a pending
    // password change never waives proof of the current password.
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: newPasswordField
  })
});

export const setPasswordSchema = z.object({
  body: z.object({
    newPassword: newPasswordField
  })
});
