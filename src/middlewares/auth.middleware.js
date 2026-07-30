import { verifyAccessToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * JWT Authentication Middleware (401 Unauthorized)
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('[AUTH ERROR] Authentication token missing or invalid format');
    return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach payload (sub, role, name, email) to request object
    next();
  } catch (error) {
    console.error('[AUTH ERROR] Access token is invalid or expired:', error.message);
    return errorResponse(res, ERROR_MESSAGES.AUTH_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware (403 Forbidden)
 * Usage: authorizeRoles('ADMIN', 'TEACHER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.error(
        `[AUTH ERROR] User role '${req.user?.role}' does not match required roles: [${allowedRoles.join(', ')}]`
      );
      return errorResponse(res, ERROR_MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }
    next();
  };
};
