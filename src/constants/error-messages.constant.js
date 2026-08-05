export const ERROR_MESSAGES = Object.freeze({
  // Generic
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Invalid input data',

  // Session
  AUTH_REQUIRED: 'Session expired or unauthenticated. Please log in again.',
  ADMIN_ONLY: 'You do not have permission to access this resource.',

  // Login
  // Deliberately identical for unknown email, wrong password, and Google-only
  // accounts, so an outsider cannot map who works in the finance team.
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_INACTIVE: 'This account has been deactivated. Please contact your Finance Lead.',

  // Password
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  PASSWORD_SAME_AS_OLD: 'New password must be different from the current one',
  PASSWORD_NOT_SET: 'This account has no password yet. Use set-password instead.',
  PASSWORD_ALREADY_SET: 'This account already has a password. Use change-password instead.',

  // Google
  GOOGLE_NOT_CONFIGURED: 'Google sign-in is not configured on this server.',
  INVALID_GOOGLE_TOKEN: 'Invalid or expired Google token',
  GOOGLE_EMAIL_UNVERIFIED: 'This Google account has an unverified email address.',
  GOOGLE_ACCOUNT_NOT_REGISTERED:
    'This account is not registered. Please contact your Finance Lead.',

  // Tokens
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',

  // Users
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  CANNOT_DEACTIVATE_SELF: 'You cannot deactivate your own account',

  // Vendors
  VENDOR_NOT_FOUND: 'Vendor not found',

  // Transactions
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  VENDOR_REQUIRED_FOR_CATEGORY: 'Vendor is required for this category'
});
