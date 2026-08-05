import { errorResponse } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

export const notFoundHandler = (req, res) => {
  console.error(`[404] ${req.method} ${req.originalUrl}`);
  return errorResponse(res, ERROR_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
};

/**
 * Last line of defence. Splits failures in two:
 *
 *   operational  — thrown deliberately via createError(), carries a safe
 *                  message meant for the user, so it is passed through.
 *   unexpected   — everything else (pg driver errors, TypeError, network
 *                  failures). Postgres messages leak table and constraint
 *                  names, google-auth-library can leak the client_id, so the
 *                  client always gets a generic 500 instead.
 *
 * Either way the full detail is logged, never sent.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export const errorHandler = (err, req, res, next) => {
  if (err.isOperational && err.statusCode) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${err.statusCode}: ${err.message}`);
    return errorResponse(res, err.message, err.statusCode);
  }

  // Malformed JSON is a client mistake, but body-parser's message quotes the
  // raw payload back, so it gets masked like any other unexpected error.
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} -> malformed JSON body`);
    return errorResponse(res, ERROR_MESSAGES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST);
  }

  console.error(`[UNHANDLED] ${req.method} ${req.originalUrl}:`, err.stack || err);
  return errorResponse(res, ERROR_MESSAGES.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
