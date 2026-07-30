import { ZodError } from 'zod';
import { errorResponse } from '../utils/api-response.util.js';
import { HTTP_STATUS } from '../constants/http-status.constant.js';

/**
 * Express Request Validation Middleware using Zod
 * Usage: router.post('/login', validate(loginSchema), controller)
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request data with parsed/sanitized Zod data
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod issues into readable object: { field: "message" }
      const formattedErrors = {};
      error.issues.forEach((issue) => {
        const path = issue.path.slice(1).join('.') || 'body';
        formattedErrors[path] = issue.message;
      });

      return errorResponse(
        res,
        'Invalid request data provided',
        HTTP_STATUS.BAD_REQUEST,
        formattedErrors
      );
    }
    next(error);
  }
};
