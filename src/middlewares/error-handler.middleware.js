import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { errorResponse } from '../utils/api-response.util.js';
import { config } from '../config/env.config.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  const errors = config.isDevelopment ? err.stack : undefined;

  return errorResponse(res, message, statusCode, errors);
};
