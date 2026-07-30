export const ERROR_MESSAGES = Object.freeze({
  AUTH_REQUIRED: 'Session expired or unauthenticated. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_INACTIVE: 'User account is deactivated. Please contact administrator.',
  USER_NOT_FOUND: 'User not found',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  PASSWORD_TOO_SHORT: 'New password must be at least 6 characters long',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
});
