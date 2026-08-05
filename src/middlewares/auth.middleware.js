import { verifyAccessToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * Rejects anyone without a valid access token.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error(`[AUTH][authenticate] missing bearer token on ${req.method} ${req.originalUrl}`);
    return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    console.error(`[AUTH][authenticate] token rejected on ${req.originalUrl}:`, error.message);
    return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * The system's only privilege check. It guards the /users endpoints and
 * nothing else — see docs/auth_user_technical.md.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    console.error(
      `[AUTH][requireAdmin] user ${req.user?.sub} denied on ${req.method} ${req.originalUrl}`
    );
    return errorResponse(res, ERROR_MESSAGES.ADMIN_ONLY, HTTP_STATUS.FORBIDDEN);
  }
  return next();
};
