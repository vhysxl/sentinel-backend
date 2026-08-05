import { errorResponse } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * Runs a zod schema shaped as { body, params, query } against the request.
 * Parsed output replaces the raw input, so handlers receive trimmed and
 * coerced values only.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    // zod's raw issues expose internal paths and codes, so map to a flat,
    // client-safe shape before it ever leaves the server.
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.slice(1).join('.') || issue.path.join('.'),
      message: issue.message
    }));

    console.error(
      `[VALIDATION] ${req.method} ${req.originalUrl} rejected:`,
      errors.map((e) => `${e.field}: ${e.message}`).join('; ')
    );

    return errorResponse(res, ERROR_MESSAGES.VALIDATION_FAILED, HTTP_STATUS.BAD_REQUEST, errors);
  }

  if (result.data.body) req.body = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query) req.query = result.data.query;

  return next();
};
